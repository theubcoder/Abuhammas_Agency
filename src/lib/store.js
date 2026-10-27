"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@supabase/supabase-js";

// Sara data dynamic — Supabase cloud hi source of truth hai.
// Koi localStorage cache, koi demo seed nahi: app cloud se hi khulta hai.

const TABLE = "employees";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let snapshot = [];
const listeners = new Set();

// Cloud par abhi kaun kaun se ids hain — delete precise rehne ke liye
let cloudKnown = false;
let cloudIds = new Set();
let pushing = false;

function emit() {
  for (const cb of listeners) cb();
}

// Purana local data clean — ab kisi ke localStorage me purane records na hon
function cleanupOldLocalData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("abuhammas-agent-employees");
    localStorage.removeItem("abuhammas-seeded");
  } catch {
    // storage blocked? koi masla nahi, cloud se hi chalega
  }
}

// ---- cloud sync ----
let warnedMissingTable = false;

function warnOnce(error) {
  const code = error?.code || "";
  if (code === "PGRST205" || code === "42P01") {
    if (!warnedMissingTable) {
      warnedMissingTable = true;
      console.warn(
        `[Supabase] Table "${TABLE}" not found — run supabase-schema.sql in Supabase SQL Editor.`
      );
    }
    return;
  }
  console.warn("[Supabase] sync failed:", error?.message || error);
}

// ---- UI state: syncing (page load) / saving (add-edit-delete ke dauran) ----
// useSyncExternalStore ko stable snapshot chahiye, is liye setUi object
// replace karta hai (mutate nahi) — warna React re-render skip kar deta hai.
const UI_SERVER = { syncing: false, saving: false };
let ui = UI_SERVER;
const uiListeners = new Set();

function setUi(partial) {
  ui = { ...ui, ...partial };
  for (const cb of uiListeners) cb();
}

function subscribeUi(callback) {
  uiListeners.add(callback);
  return () => uiListeners.delete(callback);
}

export function useUiState() {
  return useSyncExternalStore(subscribeUi, () => ui, () => UI_SERVER);
}

// ---- field mapping: app (camelCase) <-> db (snake_case) ----
function toRow(e) {
  return {
    id: e.id,
    name: e.name || null,
    phone: e.phone || null,
    iqama_number: e.iqamaNumber || null,
    kafeel_name: e.kafeelName || null,
    kafeel_phone: e.kafeelPhone || null,
    cr_number: e.crNumber || null,
    company_name: e.companyName || null,
    expiry_date: e.expiryDate || null,
  };
}

function fromRow(r) {
  return {
    id: r.id,
    name: r.name || "",
    phone: r.phone || "",
    iqamaNumber: r.iqama_number || "",
    kafeelName: r.kafeel_name || "",
    kafeelPhone: r.kafeel_phone || "",
    crNumber: r.cr_number || "",
    companyName: r.company_name || "",
    expiryDate: r.expiry_date || "",
  };
}

// Cloud se fetch — sara data yahin se aata hai
async function fetchFromCloud({ quiet } = {}) {
  if (!supabase || typeof window === "undefined" || pushing) return;
  try {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) {
      if (!quiet) warnOnce(error);
      return;
    }
    const rows = (data || []).map(fromRow);
    cloudKnown = true;
    cloudIds = new Set(rows.map((r) => r.id));
    // sirf tab re-render jab data me sach me change ho (empty cloud bhi apply
    // hota hai — ab cloud authoritative hai, local data ka koi role nahi)
    const sig = (list) => list.map((e) => e.id + "|" + JSON.stringify(e)).sort().join("~");
    if (sig(snapshot) !== sig(rows)) {
      snapshot = rows;
      emit();
    }
  } catch (err) {
    if (!quiet) console.warn("[Supabase] sync failed:", err?.message || err);
  }
}

async function syncFromCloud() {
  if (!supabase || cloudFetchingStarted) return;
  cloudFetchingStarted = true;
  cleanupOldLocalData();
  setUi({ syncing: true });
  await fetchFromCloud();
  setUi({ syncing: false });
}

let cloudFetchingStarted = false;

function subscribe(callback) {
  listeners.add(callback);
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  // mount hone par cloud se data fetch hota hai
  syncFromCloud();
  // Dynamic sync: har 10 sec me cloud check (sirf tab open/visible ho to)
  if (!pollingStarted && supabase) {
    pollingStarted = true;
    setInterval(() => {
      if (!document.hidden && !ui.saving) fetchFromCloud({ quiet: true });
    }, 10000);
    // tab wapas focus par aaye to turant refresh
    window.addEventListener("focus", () => {
      if (!ui.saving) fetchFromCloud({ quiet: true });
    });
  }
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

let pollingStarted = false;

function getSnapshot() {
  return snapshot;
}

// Cached empty array — useSyncExternalStore requires getServerSnapshot to
// return a stable value, otherwise React re-renders in an infinite loop.
const EMPTY = [];

function getServerSnapshot() {
  return EMPTY;
}

export function useEmployees() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

async function doPush(next) {
  setUi({ saving: true });
  pushing = true;
  try {
    const currentIds = new Set(next.map((e) => e.id));
    // Explicit delete: jo cloud me hain magar ab list me nahi — precise ids
    const toDelete = cloudKnown
      ? [...cloudIds].filter((id) => !currentIds.has(id))
      : [];
    if (toDelete.length > 0) {
      const { error } = await supabase.from(TABLE).delete().in("id", toDelete);
      if (error) {
        warnOnce(error);
      } else {
        for (const id of toDelete) cloudIds.delete(id);
      }
    }
    // Upsert baqi records
    const rows = next.map(toRow);
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      if (batch.length === 0) continue;
      const { error } = await supabase.from(TABLE).upsert(batch, { onConflict: "id" });
      if (error) {
        warnOnce(error);
        return;
      }
    }
    // Server ka final id set cloudIds ban jaye — delete phir kabhi miss na ho
    const { data, error: selErr } = await supabase.from(TABLE).select("id");
    if (!selErr && Array.isArray(data)) {
      cloudIds = new Set(data.map((r) => r.id));
      cloudKnown = true;
    }
    snapshot = next;
    emit();
  } catch (err) {
    console.warn("[Supabase] push failed:", err?.message || err);
  } finally {
    pushing = false;
    setUi({ saving: false });
  }
}

// Serial push queue — har save apne order me cloud jata hai
let pushTail = Promise.resolve();

function pushToCloud(next) {
  if (!supabase || typeof window === "undefined") return Promise.resolve();
  const task = pushTail.then(() => doPush(next));
  task.catch((err) => console.warn("[Supabase] push failed:", err?.message || err));
  pushTail = task;
  return pushTail;
}

export function saveEmployees(next) {
  // Pehle memory me turant update (UI instant), phir cloud push — data sirf
  // cloud ke sath sync, local storage ka koi role nahi
  snapshot = typeof next === "function" ? next(snapshot) : next;
  window.dispatchEvent(new Event("storage"));
  return pushToCloud(snapshot); // promise — await kar ke UI spinner dikha sakte hain
}

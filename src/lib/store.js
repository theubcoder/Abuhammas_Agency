"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@supabase/supabase-js";

// localStorage = turant hydrated cache + offline fallback.
// Supabase = cloud source of truth (agar .env.local me keys hon aur table bana ho).

const KEY = "abuhammas-agent-employees";
const SEED_KEY = "abuhammas-seeded";
const TABLE = "employees";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let snapshot = [];
let hydrated = false;
const listeners = new Set();

// Cloud par abhi kaun kaun se ids hain — delete dobara galat na ho iske liye
let cloudKnown = false;
let cloudIds = new Set();
let pushing = false;
let cloudSeeded = false; // purge hone se pehle local data ek dafa hi upload ho

function demoData() {
  const day = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return [
    { id: "d1", name: "Mohammed Rizwan Khan", phone: "+966 50 123 4567", iqamaNumber: "2458910234", kafeelName: "Sheikh Abdullah Al-Otaibi", kafeelPhone: "+966 55 987 6543", crNumber: "1010482910", companyName: "Al-Etaq Construction Est.", expiryDate: day(15) },
    { id: "d2", name: "Tariq Mehmood", phone: "+966 54 888 2311", iqamaNumber: "2398104821", kafeelName: "Tariq Abdulaziz Al-Mansoor", kafeelPhone: "+966 50 444 1122", crNumber: "1010482910", companyName: "Al-Etaq Construction Est.", expiryDate: day(42) },
    { id: "d3", name: "Ahmed Hassan Al-Sayed", phone: "+966 53 777 9900", iqamaNumber: "2510293847", kafeelName: "Fahad Mohammed Al-Ghamdi", kafeelPhone: "+966 51 222 3344", crNumber: "2050119283", companyName: "Red Sea Trading Co.", expiryDate: day(120) },
    { id: "d4", name: "Bilal Hussain Malik", phone: "+966 56 112 3344", iqamaNumber: "2301928475", kafeelName: "Sheikh Abdullah Al-Otaibi", kafeelPhone: "+966 55 987 6543", crNumber: "1010482910", companyName: "Al-Etaq Construction Est.", expiryDate: day(-5) },
    { id: "d5", name: "Usman Ali", phone: "+966 59 333 4455", iqamaNumber: "2499102938", kafeelName: "Sultan Khalid Al-Zahrani", kafeelPhone: "+966 58 777 6655", crNumber: "4030291823", companyName: "Zahrani Logistics Solutions", expiryDate: day(55) },
    { id: "d6", name: "Kamran Akmal", phone: "+966 57 444 8899", iqamaNumber: "2501928374", kafeelName: "Sultan Khalid Al-Zahrani", kafeelPhone: "+966 58 777 6655", crNumber: "4030291823", companyName: "Zahrani Logistics Solutions", expiryDate: day(180) },
  ];
}

function read() {
  try {
    snapshot = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(snapshot)) snapshot = [];
    // first run: pre-load the reference's sample records so colors are visible
    if (snapshot.length === 0 && !localStorage.getItem(SEED_KEY)) {
      snapshot = demoData();
      localStorage.setItem(KEY, JSON.stringify(snapshot));
      localStorage.setItem(SEED_KEY, "1");
    }
  } catch {
    snapshot = [];
  }
  hydrated = true;
  return snapshot;
}

function emit() {
  for (const cb of listeners) cb();
}

// ---- cloud sync ----
let warnedMissingTable = false;

function warnOnce(error) {
  const code = error?.code || "";
  if (code === "PGRST205" || code === "42P01") {
    if (!warnedMissingTable) {
      warnedMissingTable = true;
      console.warn(
        `[Supabase] Table "${TABLE}" not found — run supabase-schema.sql in Supabase SQL Editor. Using localStorage for now.`
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

// Cloud se fetch — dynamic updates ka core (pagination nahi, chhoti table)
async function fetchFromCloud({ quiet } = {}) {
  if (!supabase || typeof window === "undefined" || pushing) return;
  if (!hydrated) read();
  try {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) {
      if (!quiet) warnOnce(error);
      return;
    }
    const rows = (data || []).map(fromRow);
    const localEmpty = snapshot.length === 0;
    cloudKnown = true;
    cloudIds = new Set(rows.map((r) => r.id));
    // sirf tab replace karo jab mehfooz id list alag ho (warna pointless re-render)
    const currentIds = snapshot.map((e) => e.id).sort().join(",");
    const cloudJoined = rows.map((e) => e.id).sort().join(",");
    if (rows.length > 0 && (currentIds !== cloudJoined || changedContent(snapshot, rows))) {
      snapshot = rows;
      localStorage.setItem(KEY, JSON.stringify(rows));
      emit();
    }
    // Migration: cloud khali ho magar is device ka local data mojood ho —
    // ek dafa poori list cloud me upload karo, taake phone/laptop sab devices
    // par wahi ek data dikhe (pehle pushes table na hone ki wajah se fail
    // ho chuke the, is liye data sirf localStorage me ghira tha).
    if (rows.length === 0 && !localEmpty && !cloudSeeded) {
      cloudSeeded = true;
      doPush(snapshot);
    }
  } catch (err) {
    if (!quiet) console.warn("[Supabase] sync failed:", err?.message || err);
  }
}

// poray document ka content compare — koi record edit hua ho to UI update ho
function changedContent(local, cloud) {
  if (local.length !== cloud.length) return true;
  const map = new Map(local.map((e) => [e.id, JSON.stringify(e)]));
  return cloud.some((e) => map.get(e.id) !== JSON.stringify(e));
}

async function syncFromCloud() {
  if (!supabase || cloudFetchingStarted) return;
  cloudFetchingStarted = true;
  setUi({ syncing: true });
  await fetchFromCloud();
  setUi({ syncing: false });
}

let cloudFetchingStarted = false;

function subscribe(callback) {
  listeners.add(callback);
  const onStorage = () => {
    read();
    callback();
  };
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
  if (!hydrated) read();
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
    // Explicit delete: jo cloud me hain magar ab local me nahi — precise ids
    // (pehle wala not-in approach kabhi fail hoke purana record wapas la sakta tha)
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
    // dobara confirm karo — server ka actual final id set cloudIds ban jaye
    const { data, error: selErr } = await supabase.from(TABLE).select("id");
    if (!selErr && Array.isArray(data)) {
      cloudIds = new Set(data.map((r) => r.id));
      cloudKnown = true;
    }
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
  snapshot = typeof next === "function" ? next(snapshot) : next;
  localStorage.setItem(KEY, JSON.stringify(snapshot));
  // notify same-tab listeners (cross-tab sync fires via the real storage event)
  window.dispatchEvent(new Event("storage"));
  return pushToCloud(snapshot); // promise — await kar ke UI spinner dikha sakte hain
}

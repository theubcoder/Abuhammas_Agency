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
let cloudFetched = false;
const listeners = new Set();

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

function subscribe(callback) {
  listeners.add(callback);
  const onStorage = () => {
    read();
    callback();
  };
  window.addEventListener("storage", onStorage);
  // mount hone par cloud se ek dafa data fetch hota hai
  syncFromCloud();
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!hydrated) read();
  return snapshot;
}

export function useEmployees() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Cached empty array — useSyncExternalStore requires getServerSnapshot to
// return a stable value, otherwise React re-renders in an infinite loop.
const EMPTY = [];

function getServerSnapshot() {
  return EMPTY;
}

// ---- cloud sync ----let warnedMissingTable = false;

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

// ---- cloud sync ----
async function syncFromCloud() {
  if (!supabase || cloudFetched || typeof window === "undefined") return;
  cloudFetched = true;
  if (!hydrated) read();
  setUi({ syncing: true });
  try {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) {
      warnOnce(error);
      return;
    }
    const rows = (data || []).map(fromRow);
    // Cloud is source of truth: agar usme data hai to local replace karo
    if (rows.length > 0) {
      snapshot = rows;
      localStorage.setItem(KEY, JSON.stringify(rows));
      emit();
    }
  } catch (err) {
    console.warn("[Supabase] sync failed:", err?.message || err);
  } finally {
    setUi({ syncing: false });
  }
}

async function doPush(next) {
  setUi({ saving: true });
  try {
    const rows = next.map(toRow);
    const ids = next.map((e) => e.id);
    // Jo records cloud me magar local state me nahi hain unhe delete karo
    const deleteQuery = supabase.from(TABLE).delete();
    if (ids.length > 0) {
      await deleteQuery.not("id", "in", `(${ids.join(",")})`);
    } else {
      await deleteQuery.neq("id", "__none__"); // empty state: sab delete
    }
    if (rows.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "id" });
      if (error) warnOnce(error);
    }
  } catch (err) {
    console.warn("[Supabase] push failed:", err?.message || err);
  } finally {
    setUi({ saving: false });
  }
}

// Serial push queue — har save apne order me cloud jata hai
let pushTail = Promise.resolve();

function pushToCloud(next) {
  if (!supabase || typeof window === "undefined") return Promise.resolve();
  const task = pushTail.then(() => doPush(next));
  // pushTail kabhi reject nahi hoga chalega (task catch hota hai neeche)
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

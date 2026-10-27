"use client";

import { useSyncExternalStore } from "react";

// Dark mode stored as a `.dark` class on <html>, persisted in localStorage.
// An inline script in layout.js applies it before first paint (no flash).
const KEY = "ah-theme";
const listeners = new Set();

function subscribe(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function toggle() {
  const darkNow = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem(KEY, darkNow ? "dark" : "light");
  } catch {
    // storage unavailable — theme still works for this session
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [dark, toggle];
}

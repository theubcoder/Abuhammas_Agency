"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [dark, toggle] = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:shadow-none dark:hover:border-slate-600 dark:hover:text-slate-100"
    >
      <i
        className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`}
        aria-hidden="true"
      ></i>
    </button>
  );
}

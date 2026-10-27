"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteModal({ employees = [], onConfirm, onClose }) {
  // Escape key se bhi band ho sake
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const [busy, setBusy] = useState(false);
  const list = Array.isArray(employees) ? employees : employees ? [employees] : [];
  const count = list.length;
  const isMulti = count > 1;
  const firstNames = list
    .map((e) => String(e?.name || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      console.warn("Delete failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={{ animationDelay: "50ms" }}
        className="animate-fade-up w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30">
            <Trash2 className="animate-red-pulse h-6 w-6 text-rose-500" />
          </div>
        </div>

        <h2 className="text-center text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isMulti ? `Delete ${count} Records?` : "Delete Record?"}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {isMulti ? (
            <>
              You are about to permanently delete{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {count} records
              </span>{" "}
              {firstNames.length > 0 && (
                <>
                  ({firstNames.join(", ")}
                  {count > firstNames.length && ` and ${count - firstNames.length} more`})
                </>
              )}
              . This action cannot be undone.
            </>
          ) : (
            <>
              You are about to permanently delete{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {firstNames[0] || "this record"}
              </span>
              . This action cannot be undone.
            </>
          )}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="cursor-pointer flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting…" : isMulti ? `Delete ${count}` : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

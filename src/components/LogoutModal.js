"use client";

import { useEffect, useState } from "react";
import { LogOut, Loader2, X } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Logout error:", err);
      setBusy(false);
    }
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Icon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 dark:bg-rose-500/15">
            <LogOut className="h-6 w-6" />
          </div>
        </div>

        {/* Modal Title & Bilingual Touch */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
            <span>Log Out of Agency?</span>
            <span className="font-urdu text-sm text-slate-400 dark:text-slate-500">
              لاگ آؤٹ
            </span>
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Are you sure you want to end your current session? You will need to enter your admin credentials again to access the dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-500 active:scale-95 disabled:opacity-60 dark:shadow-rose-950/40"
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>Yes, Log Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

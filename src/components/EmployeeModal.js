"use client";

import { useMemo, useState } from "react";
import { X, User, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { daysLabel, getStatus } from "@/lib/iqama";

const EMPTY = {
  name: "",
  phone: "",
  iqamaNumber: "",
  companyName: "",
  kafeelName: "",
  kafeelPhone: "",
  crNumber: "",
  expiryDate: "",
};

// Saudi phone validation — 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 9665XXXXXXXX sab accept (spaces/dashes ignore)
// Landline (011/012/013... area codes) bhi allowed: 011XXXXXXX
export function isValidSaudiNumber(raw) {
  const digits = String(raw).replace(/[^0-9]/g, "");
  // strip 00 international prefix if present (00966...)
  const intl = digits.startsWith("00966") ? "966" + digits.slice(5) : digits;
  if (intl.startsWith("966")) {
    const rest = intl.slice(3);
    return /^(5\d{8}|1[1-4]\d{7})$/.test(rest);
  }
  // local format: mobile 05XXXXXXXX (10 digits) ya landline 011XXXXXXX (9 digits)
  if (digits.startsWith("0")) {
    return /^0(5\d{8}|1[1-4]\d{7})$/.test(digits);
  }
  // mobile without leading zero: 5XXXXXXXX
  return /^5\d{8}$/.test(intl);
}

// Har field ka apna validator — error message return karta hai ("" = theek hai)
const validators = {
  name: (v) => (String(v).trim() ? "" : "Full Name is required."),
  iqamaNumber: (v) => {
    const s = String(v).trim();
    if (!s) return "Iqama Number is required.";
    return /^\d{10}$/.test(s) ? "" : "Iqama number must be exactly 10 digits.";
  },
  expiryDate: (v) =>
    String(v).trim() ? "" : "Iqama Expiry Date is required.",
  phone: (v) =>
    String(v).trim() && !isValidSaudiNumber(v)
      ? "Invalid Saudi number — use 05XXXXXXXX or +9665XXXXXXXX."
      : "",
  kafeelPhone: (v) =>
    String(v).trim() && !isValidSaudiNumber(v)
      ? "Invalid Saudi kafeel number — use 05XXXXXXXX or +9665XXXXXXXX."
      : "",
};

// Phone auto-correct — space/dash/koi extra character type hota hai to khud strip ho jata hai,
// sirf digits aur starting ka + rehta hai. Is se "do dash ke baad" type issues nahi aate.
function cleanPhone(v) {
  return String(v).replace(/[^0-9+]/g, "");
}

export default function EmployeeModal({ initial, onSave, onClose, employees = [] }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY });
  // Har field ka "user ne chhua" flag — error tabhi dikhate hain jab user us field use kare
  const [touched, setTouched] = useState({});
  const [, setDirty] = useState(false); // form change tracking (parent sync ke liye)
  const [submitTried, setSubmitTried] = useState(false);
  const [busy, setBusy] = useState(false);

  // Pehle se entered (unique) kafeel/sponsor — same kafeel na dobara likhna pare,
  // aur chhota "txt change" (spelling/case) se filter na toote.
  const kafeelList = useMemo(() => {
    const map = new Map(); // lowercase name -> { name, phone }
    for (const e of employees) {
      const n = String(e.kafeelName || "").trim();
      if (!n) continue;
      const k = n.toLowerCase();
      if (!map.has(k)) map.set(k, { name: n, phone: String(e.kafeelPhone || "").trim() });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  function set(key, value) {
    // Phone fields live auto-correct: space/dash/extra chars likhte hi strip ho jate hain
    const clean =
      key === "phone" || key === "kafeelPhone" ? cleanPhone(value) : value;
    setForm((f) => ({ ...f, [key]: clean }));
    setDirty(true);
  }

  function markTouched(key) {
    setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  }

  // Kafeel select/type: existing kafeel match hote hi canonical spelling aur
  // uska phone number auto-fill ho jata hai — data consistent rehta hai.
  function setKafeel(value) {
    setDirty(true);
    const v = value;
    const match = kafeelList.find(
      (k) => k.name.toLowerCase() === v.trim().toLowerCase()
    );
    if (match) {
      setForm((f) => ({
        ...f,
        kafeelName: match.name,
        ...(match.phone ? { kafeelPhone: match.phone } : {}),
      }));
    } else {
      set("kafeelName", v);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitTried(true);
    // Submit par saari fields "touched" — phir har input ke neeche apna error dikhta hai
    setTouched({
      name: true,
      iqamaNumber: true,
      expiryDate: true,
      phone: true,
      kafeelPhone: true,
    });
    if (Object.keys(validators).some((k) => validators[k](form[k]))) return;
    setBusy(true);
    try {
      await onSave(
        initial
          ? { ...form }
          : { ...form, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
      );
    } finally {
      // modal parent resolve hone par band hota hai, lekin safety reset
      setBusy(false);
    }
  }

  // Per-field live error — sirf touched/submit ke baad dikhata hai (pehle se nahi)
  const errFor = (key) =>
    touched[key] || submitTried ? validators[key]?.(form[key]) || "" : "";
  const st = form.expiryDate ? getStatus(form.expiryDate) : null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={{ animationDelay: "50ms" }}
        className="animate-fade-up relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          <User className="h-5 w-5 text-indigo-500" />
          {initial ? "Edit Personnel Record" : "Add New Personnel"}
        </h2>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Full Name *
            </span>
            <input
              type="text"
              placeholder="e.g. Ahmed Al-Mansoor"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => markTouched("name")}
              className={errFor("name") ? errCls : inputCls}
            />
            {errFor("name") && (
              <span className="mt-1 block text-xs text-rose-500">{errFor("name")}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Phone Number
            </span>
            <input
              type="tel"
              dir="ltr"
              placeholder="05XXXXXXXX / +9665XXXXXXXX"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => markTouched("phone")}
              className={errFor("phone") ? errCls : inputCls}
            />
            {errFor("phone") && (
              <span className="mt-1 block text-xs text-rose-500">{errFor("phone")}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Iqama Number *
            </span>
            <input
              type="tel"
              dir="ltr"
              placeholder="10 digit Iqama ID"
              value={form.iqamaNumber ?? ""}
              onChange={(e) => set("iqamaNumber", e.target.value)}
              onBlur={() => markTouched("iqamaNumber")}
              className={errFor("iqamaNumber") ? errCls : inputCls}
            />
            {errFor("iqamaNumber") && (
              <span className="mt-1 block text-xs text-rose-500">{errFor("iqamaNumber")}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Iqama Expiry Date *
            </span>
            <input
              type="date"
              title="Select Iqama Expiry Date"
              value={form.expiryDate ?? ""}
              onChange={(e) => set("expiryDate", e.target.value)}
              onBlur={() => markTouched("expiryDate")}
              className={`${errFor("expiryDate") ? errCls : inputCls} rtl-date`}
            />
            {errFor("expiryDate") && (
              <span className="mt-1 block text-xs text-rose-500">{errFor("expiryDate")}</span>
            )}
          </label>
          {st && (
            <p className={`col-span-full -mt-2 flex items-center gap-2 text-xs font-medium ${st.bg} rounded-lg px-3 py-2`}>
              {st.key === "red" ? (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              ) : st.key === "yellow" ? (
                <Calendar className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Calendar className="h-3.5 w-3.5 shrink-0" />
              )}
              {st.label} — {daysLabel(st.days)}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Kafeel / Sponsor Name
            </span>
            <input
              type="text"
              list="kafeel-suggestions"
              placeholder="Sponsor Full Name"
              title="Type new sponsor, or pick an existing one from the list"
              value={form.kafeelName ?? ""}
              onChange={(e) => setKafeel(e.target.value)}
              className={inputCls}
            />
            <datalist id="kafeel-suggestions">
              {kafeelList.map((k) => (
                <option key={k.name} value={k.name} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Kafeel Contact Number
            </span>
            <input
              type="tel"
              dir="ltr"
              placeholder="05XXXXXXXX / +9665XXXXXXXX"
              value={form.kafeelPhone ?? ""}
              onChange={(e) => set("kafeelPhone", e.target.value)}
              onBlur={() => markTouched("kafeelPhone")}
              className={errFor("kafeelPhone") ? errCls : inputCls}
            />
            {errFor("kafeelPhone") && (
              <span className="mt-1 block text-xs text-rose-500">{errFor("kafeelPhone")}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              CR / Muassasa Number
            </span>
            <input
              type="tel"
              dir="ltr"
              placeholder="CR Registration Number"
              value={form.crNumber ?? ""}
              onChange={(e) => set("crNumber", e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Muassasa / Company Name
            </span>
            <input
              type="text"
              placeholder="Enterprise Name"
              value={form.companyName ?? ""}
              onChange={(e) => set("companyName", e.target.value)}
              className={inputCls}
            />
          </label>

          <div className="col-span-full flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : initial ? (
                "Update Record"
              ) : (
                "Save Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full cursor-text rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500";

// Invalid field ka error style — rose border + rose ring
const errCls =
  "w-full cursor-text rounded-xl border border-rose-500 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500";

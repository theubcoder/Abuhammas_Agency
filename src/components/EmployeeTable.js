"use client";

import { useEffect, useRef } from "react";
import { formatDate, daysLabel, getStatus } from "@/lib/iqama";
import {
  Phone,
  MessageSquare,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

const STATUS_ICON = {
  red: AlertTriangle,
  yellow: Clock,
  green: CheckCircle2,
};

export default function EmployeeTable({
  employees,
  onEdit,
  onDelete,
  onView,
  selectedIds = [],
  onSelect,
  onSelectAll,
  total = 0,
}) {
  if (employees.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-10 text-center sm:p-16 ${
          "border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
        }`}
      >
        <FileIcon />
        <p className="text-sm font-medium text-slate-400 dark:text-slate-300">
          No records found matching your filters.
        </p>
      </div>
    );
  }

  const selectedSet = new Set(selectedIds);
  const isAllSelected =
    employees.length > 0 && employees.every((e) => selectedSet.has(e.id));
  const isSomeSelected =
    !isAllSelected && employees.some((e) => selectedSet.has(e.id));

  return (
    <>
      {/* Mobile — cards */}
      <div className="grid gap-3 sm:hidden">
        {employees.map((e, i) => {
          const st = getStatus(e.expiryDate);
          const StatusIcon = STATUS_ICON[st.key];
          return (
            <div
              key={e.id}
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              className={`animate-fade-up rounded-2xl border border-slate-200 border-l-2 ${st.accent} bg-white p-4 shadow dark:border-slate-800 dark:bg-slate-900/60 ${
                selectedSet.has(e.id) ? "ring-2 ring-rose-500/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(e.id)}
                    onChange={(ev) => onSelect(e.id, ev.target.checked)}
                    aria-label={`Select ${e.name}`}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-rose-500"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {e.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                      <Phone className="h-3 w-3 shrink-0 text-indigo-400" />
                      <span className="truncate">{e.phone}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.bg} ${
                    st.key === "red" ? "animate-red-pulse" : ""
                  }`}
                >
                  <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                  {daysLabel(st.days)}
                </span>
              </div>

              <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <Field label="Iqama No" value={e.iqamaNumber} mono />
                <Field label="Kafeel (Sponsor)" value={e.kafeelName} />
                <Field label="Kafeel Phone" value={e.kafeelPhone} mono />
                <Field label="Muassasa / Company" value={e.companyName} />
                <Field label="CR Number" value={e.crNumber} mono />
                <Field label="Exp Date" value={formatDate(e.expiryDate)} />
              </dl>

              <div className="mt-3.5 flex gap-2">
                <a
                  href={`https://wa.me/${String(e.phone).replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp Person"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 transition hover:bg-emerald-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
                <button
                  onClick={() => onView(e)}
                  title="View Full Profile"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                    "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(e)}
                  title="Edit Record"
                  className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-medium transition ${
                    "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Edit2 className="h-3.5 w-3.5 shrink-0" /> Edit
                </button>
                <button
                  onClick={() => onDelete(e)}
                  title="Delete Record"
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500/10 text-xs font-medium text-rose-500 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet & desktop — table */}
      <div
        className={`hidden overflow-hidden rounded-2xl border sm:block ${
          "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left table-fixed">
            <thead>
              <tr
                className={`border-b text-xs font-semibold uppercase tracking-wider ${
                  "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400"
                }`}
              >
                <th className="py-4 pl-6 pr-2 w-12">
                  <SelectAllCheckbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={(checked) => onSelectAll(checked)}
                  />
                </th>
                <th className="px-4 py-4 w-48">Personnel Info</th>
                <th className="px-4 py-4 w-36">Iqama Details</th>
                <th className="px-4 py-4 w-48">Kafeel / Sponsor</th>
                <th className="px-4 py-4 w-44">CR / Muassasa</th>
                <th className="px-4 py-4 w-40">Expiry Status</th>
                <th className="px-6 py-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-sm ${"divide-slate-100 dark:divide-slate-800/60"}`}>
              {employees.map((person, i) => {
                const st = getStatus(person.expiryDate);
                const StatusIcon = STATUS_ICON[st.key];
                return (
                  <tr
                    key={person.id}
                    style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    className={`animate-fade-up transition hover:bg-slate-800/40 ${
                      "hover:bg-slate-50/80"
                    } ${selectedSet.has(person.id) ? "bg-rose-500/5 dark:bg-rose-500/10" : ""}`}
                  >
                    {/* Select checkbox */}
                    <td className="py-4 pl-6 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(person.id)}
                        onChange={(ev) => onSelect(person.id, ev.target.checked)}
                        aria-label={`Select ${person.name}`}
                        className="h-4 w-4 cursor-pointer accent-rose-500"
                      />
                    </td>

                    {/* Personnel Info */}
                    <td className="px-4 py-4 truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={person.name}>
                        {person.name}
                      </div>
                      <div
                        className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate"
                        dir="ltr"
                      >
                        <Phone className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate">{person.phone}</span>
                      </div>
                    </td>

                    {/* Iqama Number chip */}
                    <td className="px-4 py-4 truncate">
                      <span
                        className="inline-block max-w-full truncate rounded-md border border-slate-600/50 bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-800 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-200"
                        dir="ltr"
                        title={person.iqamaNumber}
                      >
                        {person.iqamaNumber}
                      </span>
                    </td>

                    {/* Kafeel */}
                    <td className="px-4 py-4 truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={person.kafeelName}>
                        {person.kafeelName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr" title={person.kafeelPhone}>
                        {person.kafeelPhone}
                      </div>
                    </td>

                    {/* CR / Muassasa */}
                    <td className="px-4 py-4 truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={person.companyName}>
                        {person.companyName}
                      </div>
                      <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr" title={person.crNumber}>
                        CR: {person.crNumber}
                      </div>
                    </td>

                    {/* Expiry Status */}
                    <td className="px-4 py-4 truncate">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.bg} ${
                            st.key === "red" ? "animate-red-pulse" : ""
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          {daysLabel(st.days)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                        Exp: {formatDate(person.expiryDate)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://wa.me/${String(person.phone).replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 transition hover:bg-emerald-500/20"
                          title="WhatsApp Person"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => onView(person)}
                          title="View Full Profile"
                          className={`rounded-lg border p-2 transition ${
                            "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          }`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(person)}
                          title="Edit Record"
                          className={`rounded-lg border p-2 transition ${
                            "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          }`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(person)}
                          title="Delete Record"
                          className="rounded-lg bg-rose-500/10 p-2 text-rose-500 transition hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {total === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SelectAllCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label="Select all records"
      title="Select all records"
      className="h-4 w-4 cursor-pointer accent-rose-500"
    />
  );
}

function Field({ label, value, mono = false, className = "" }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate ${mono ? "font-mono" : ""} text-slate-700 dark:text-slate-300 ${className}`}
        dir="ltr"
      >
        {value}
      </dd>
    </div>
  );
}

function FileIcon() {
  return (
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
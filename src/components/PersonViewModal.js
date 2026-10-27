"use client";

import {
  X,
  Phone,
  MessageSquare,
  Building2,
  FileText,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { getStatus, daysLabel } from "@/lib/iqama";

export default function PersonViewModal({ person, onClose, onEdit }) {
  const st = getStatus(person.expiryDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Profile Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-xl font-bold text-indigo-400">
            {(person.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {person.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
              {person.phone}
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.bg} ${
                st.key === "red" ? "animate-red-pulse" : ""
              }`}
            >
              {st.label} · {daysLabel(st.days)}
            </span>
          </div>
        </div>

        {/* Details Breakdown */}
        <div className="space-y-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-800/80">
          <Row icon={<FileText className="h-4 w-4 text-indigo-400" />} label="Iqama Number">
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100" dir="ltr">
              {person.iqamaNumber}
            </span>
          </Row>

          <Row icon={<Calendar className="h-4 w-4 text-indigo-400" />} label="Expiry Date">
            <span className="font-medium text-slate-900 dark:text-slate-100" dir="ltr">
              {person.expiryDate}
            </span>
          </Row>

          <Row icon={<User className="h-4 w-4 text-indigo-400" />} label="Kafeel / Sponsor">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {person.kafeelName}
            </span>
          </Row>

          <Row icon={<Phone className="h-4 w-4 text-indigo-400" />} label="Kafeel Contact">
            <span className="font-medium text-slate-900 dark:text-slate-100" dir="ltr">
              {person.kafeelPhone}
            </span>
          </Row>

          <Row icon={<Building2 className="h-4 w-4 text-indigo-400" />} label="Muassasa Name">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {person.companyName}
            </span>
          </Row>

          <Row icon={<Sparkles className="h-4 w-4 text-indigo-400" />} label="CR Number">
            <span className="font-mono font-medium text-slate-900 dark:text-slate-100" dir="ltr">
              {person.crNumber}
            </span>
          </Row>
        </div>

        {/* Quick Contact Bar */}
        <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <a
            href={`tel:${person.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-medium text-indigo-500 transition hover:bg-indigo-500/20"
          >
            <Phone className="h-4 w-4" /> Call Person
          </a>

          <a
            href={`https://wa.me/${String(person.kafeelPhone).replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-500 transition hover:bg-emerald-500/20"
          >
            <MessageSquare className="h-4 w-4" /> WhatsApp Kafeel
          </a>

          <button
            onClick={() => onEdit(person)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Edit Record
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {icon} {label}
      </span>
      {children}
    </div>
  );
}

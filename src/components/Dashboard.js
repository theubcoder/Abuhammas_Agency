"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Loader2,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { getStatus, daysLabel } from "@/lib/iqama";
import { useEmployees, saveEmployees, useUiState } from "@/lib/store";
import { exportPersonnelCSV } from "@/lib/csv";
import { useTheme } from "@/lib/theme";
import EmployeeTable from "./EmployeeTable";
import EmployeeModal from "./EmployeeModal";
import PersonViewModal from "./PersonViewModal";
import DeleteModal from "./DeleteModal";
import LogoutModal from "./LogoutModal";

const FILTERS = [
  { id: "all", label: "All Records" },
  { id: "red", label: "1 Month Expiry (Red)" },
  { id: "yellow", label: "2 Month Expiry (Yellow)" },
  { id: "green", label: "Safe (Green)" },
];

export default function Dashboard() {
  const employees = useEmployees();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | red | yellow | green
  const [kafeelFilter, setKafeelFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [pendingDeleteList, setPendingDeleteList] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dark] = useTheme();
  const ui = useUiState(); // syncing (page load) / saving (cloud push)
  const router = useRouter();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Auto-logout from all devices if credentials change in .env.local
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.authenticated) {
          window.location.href = "/login";
        }
      } catch (e) {
        // network glitch
      }
    }
    checkAuth();
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, []);

  async function handleConfirmLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "/login";
    }
  }

  const uniqueKafeels = useMemo(
    () => [...new Set(employees.map((e) => e.kafeelName).filter(Boolean))].sort(),
    [employees]
  );

  const counts = useMemo(() => {
    const c = { red: 0, yellow: 0, green: 0 };
    for (const e of employees) c[getStatus(e.expiryDate).key] += 1;
    return c;
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) =>
        statusFilter === "all" ? true : getStatus(e.expiryDate).key === statusFilter
      )
      .filter((e) => (kafeelFilter === "all" ? true : e.kafeelName === kafeelFilter))
      .filter((e) =>
        q
          ? [e.name, e.phone, e.iqamaNumber, e.crNumber, e.companyName, e.kafeelName]
              .filter(Boolean)
              .some((v) => v.toLowerCase().includes(q))
          : true
      )
      .sort((a, b) => (a.expiryDate || "").localeCompare(b.expiryDate || ""));
  }, [employees, query, statusFilter, kafeelFilter]);

  const cardBase = `p-4 rounded-2xl border transition-all cursor-pointer sm:p-5 ${
    dark
      ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900"
      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
  }`;
  const chipBase = `text-xs px-2 py-0.5 rounded-full border font-medium ${dark ? "bg-slate-900/80 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"}`;

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setModalOpen(true);
  }

  async function save(emp) {
    await saveEmployees((prev) =>
      editing ? prev.map((e) => (e.id === emp.id ? emp : e)) : [emp, ...prev]
    );
    setModalOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    const ids = new Set((pendingDeleteList || []).map((e) => e.id));
    await saveEmployees((prev) => prev.filter((e) => !ids.has(e.id)));
    if (selectedPerson && ids.has(selectedPerson.id)) setSelectedPerson(null);
    setSelectedIds((prev) => prev.filter((id) => !ids.has(id)));
    setPendingDeleteList(null);
  }

  function toggleSelect(id, checked) {
    setSelectedIds((prev) =>
      checked
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((x) => x !== id)
    );
  }

  function toggleSelectAll(checked) {
    setSelectedIds(checked ? filtered.map((e) => e.id) : []);
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          dark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white/80"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Custom Logo Image replacement */}
            <div className="shrink-0 overflow-hidden rounded-xl border border-indigo-500/20 bg-white/10 p-1 shadow-md shadow-indigo-500/10">
              <img
                src="/images/Hammas-Logo.png"
                alt="Hammas Logo"
                className="h-8 w-8 object-contain sm:h-9 sm:w-9"
              />
            </div>
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100 sm:gap-2 sm:text-lg">
                <span className="truncate" dir="ltr">
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500 bg-clip-text text-transparent">
                    Abu Hammas
                  </span>
                  <span
                    dir="rtl"
                    className="font-urdu ml-1.5 text-slate-700 leading-none dark:text-slate-300"
                    style={{ fontSize: "0.85rem" }}
                  >
                    ابو حمّاس
                  </span>
                </span>
                <span className="hidden shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-mono text-xs text-indigo-400 sm:inline-block">
                  PRO
                </span>
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Agency Iqama &amp; CR Management
                <span
                  dir="rtl"
                  className="font-urdu ml-1.5 text-[11px] leading-none text-slate-400 dark:text-slate-500"
                >
                  ایجنسی آئی قامہ پلٹ فارم
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Personnel</span>
              <span className="sm:hidden">Add</span>
            </button>

            <ThemeToggleButton />

            <button
              onClick={() => setLogoutModalOpen(true)}
              title="Logout from Agency System"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Dashboard KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div
            onClick={() => {
              setStatusFilter("all");
              setKafeelFilter("all");
            }}
            className={`${cardBase} animate-fade-up ${statusFilter === "all" && kafeelFilter === "all" ? "ring-2 ring-indigo-500" : ""}`}
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  dark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Total Personnel
              </span>
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500 sm:p-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-3xl">
                {employees.length}
              </span>
              <span className={`${chipBase} text-indigo-400`}>Active System</span>
            </div>
          </div>

          {/* Critical — Red (≤ 30 days) */}
          <div
            onClick={() => setStatusFilter("red")}
            className={`${cardBase} animate-fade-up ${statusFilter === "red" ? "ring-2 ring-rose-500" : ""}`}
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                Critical (≤ 1 Month)
              </span>
              <div className="animate-red-pulse rounded-lg bg-rose-500/10 p-1.5 text-rose-500 sm:p-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-rose-500 sm:text-3xl">{counts.red}</span>
              <span className={`chip rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400`}>
                Urgent Action
              </span>
            </div>
          </div>

          {/* Warning — Yellow (31–60 days) */}
          <div
            onClick={() => setStatusFilter("yellow")}
            className={`${cardBase} animate-fade-up ${statusFilter === "yellow" ? "ring-2 ring-amber-500" : ""}`}
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                Warning (≤ 2 Months)
              </span>
              <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500 sm:p-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-500 sm:text-3xl">{counts.yellow}</span>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                Renew Soon
              </span>
            </div>
          </div>

          {/* Safe — Green (> 60 days) */}
          <div
            onClick={() => setStatusFilter("green")}
            className={`${cardBase} animate-fade-up ${statusFilter === "green" ? "ring-2 ring-emerald-500" : ""}`}
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Safe (&gt; 2 Months)
              </span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500 sm:p-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-500 sm:text-3xl">{counts.green}</span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Valid Status
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div
          className={`mb-6 mt-8 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 ${
            dark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          {/* Search */}
          <div className="relative w-full sm:min-w-[260px] sm:flex-1">
            <Search
              className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                dark ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search by Name, Iqama, Kafeel, or CR number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                dark
                  ? "border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-500"
                  : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Status Pills */}
          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {FILTERS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition ${
                  statusFilter === pill.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : dark
                      ? "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Kafeel Filter + CSV Export */}
          <div className="flex items-center gap-2">
            <Filter
              className={`h-4 w-4 ${dark ? "text-slate-400" : "text-slate-500"}`}
            />
            <select
              value={kafeelFilter}
              onChange={(e) => setKafeelFilter(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium outline-none transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                dark
                  ? "border-slate-800 bg-slate-950 text-slate-200"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <option value="all">All Kafeels / Sponsors</option>
              {uniqueKafeels.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <button
              onClick={() => exportPersonnelCSV(filtered)}
              title="Export filtered list to CSV"
              className={`cursor-pointer rounded-xl border p-2.5 transition ${
                dark
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Bulk delete */}
            {selectedIds.length > 0 && (
              <button
                onClick={() =>
                  setPendingDeleteList(
                    employees.filter((e) => selectedIds.includes(e.id))
                  )
                }
                title="Delete all selected records"
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {ui.syncing ? (
          <div
            className={`rounded-2xl border p-4 sm:p-6 ${
              dark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 px-1 pb-4 text-xs font-medium text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              Syncing records from cloud…
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ animationDelay: `${i * 100}ms` }}
                  className="animate-pulse grid grid-cols-2 gap-3 rounded-xl bg-slate-100 px-4 py-5 dark:bg-slate-800/70 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
                >
                  <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="hidden h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 sm:block" />
                  <div className="hidden h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 sm:block" />
                  <div className="hidden h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 sm:block" />
                  <div className="h-4 w-8 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmployeeTable
            employees={filtered}
            total={employees.length}
            onView={setSelectedPerson}
            onEdit={openEdit}
            onDelete={(p) => setPendingDeleteList([p])}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 ${dark ? "border-slate-800" : "border-slate-200"}`}
      >
        <p className="text-center text-xs text-slate-500 dark:text-slate-500">
          © Abu Hammas — Agency Iqama &amp; CR Management System
        </p>
      </footer>

      {/* Global saving indicator */}
      {ui.saving && (
        <div
          style={{ animationDelay: "0ms" }}
          className="animate-fade-up fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-xs font-medium text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300"
        >
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          Saving to cloud…
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <EmployeeModal
          initial={editing}
          onSave={save}
          onClose={() => setModalOpen(false)}
          employees={employees}
        />
      )}

      {/* Detailed person profile modal */}
      {selectedPerson && (
        <PersonViewModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onEdit={(p) => {
            setSelectedPerson(null);
            openEdit(p);
          }}
        />
      )}

      {/* Delete confirmation */}
      {pendingDeleteList && (
        <DeleteModal
          employees={pendingDeleteList}
          onConfirm={confirmDelete}
          onClose={() => setPendingDeleteList(null)}
        />
      )}

      {/* Custom Logout confirmation modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onConfirm={handleConfirmLogout}
        onClose={() => setLogoutModalOpen(false)}
      />
    </>
  );
}

function ThemeToggleButton() {
  const [dark, toggle] = useTheme();
  return (
    <button
      onClick={toggle}
      title="Toggle Theme"
      className={`rounded-xl border p-2.5 transition ${
        dark
          ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

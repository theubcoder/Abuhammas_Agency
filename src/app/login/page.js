"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & UI states
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Rate limiting / lockout countdown
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Clear all states and fields whenever login page mounts or is navigated to
  useEffect(() => {
    setUsername("");
    setPassword("");
    setLoading(false);
    setIsSuccess(false);
    setErrors({});
    setServerError("");
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setServerError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Client-side validation function
  const validate = () => {
    const errs = {};
    if (!username.trim()) {
      errs.username = "Username is required.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 3) {
      errs.password = "Password must be at least 3 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (lockoutSeconds > 0) return;

    if (!validate()) {
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        triggerShake();

        if (res.status === 429 && data.retryAfter) {
          setLockoutSeconds(data.retryAfter);
          setServerError(data.error || "Too many failed attempts.");
        } else if (data.errors) {
          setErrors(data.errors);
          setServerError("Please fix the validation errors below.");
        } else {
          setServerError(data.error || "Invalid credentials.");
        }
        return;
      }

      // Success
      setIsSuccess(true);
      setLoading(false);

      // Clean redirect to dashboard
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err) {
      setLoading(false);
      triggerShake();
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Bar with Agency Header & Theme Toggle */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="shrink-0 overflow-hidden rounded-2xl border border-indigo-500/20 bg-white/60 p-1.5 shadow-md shadow-indigo-500/10 backdrop-blur-sm dark:bg-slate-900/60 dark:border-slate-800">
            <img
              src="/images/Hammas-Logo.png"
              alt="Hammas Logo"
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Abu Hammas</span>
              <span className="font-urdu text-indigo-500 dark:text-indigo-400 font-semibold text-base">
                ابو حمّاس
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Agency Management Portal
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <main className="flex flex-1 items-center justify-center">
        <div
          className={`w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none ${
            shake ? "animate-shake" : "animate-fade-up"
          }`}
        >
          {/* Card Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 dark:bg-indigo-950/60 dark:text-indigo-400 dark:ring-indigo-950/30">
              {isSuccess ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-500 animate-bounce" />
              ) : lockoutSeconds > 0 ? (
                <ShieldAlert className="h-7 w-7 text-rose-500" />
              ) : (
                <Lock className="h-7 w-7" />
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isSuccess
                ? "Login Successful!"
                : "Sign in to Dashboard"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isSuccess
                ? "Redirecting you to the agency dashboard..."
                : "Enter your agency admin credentials to continue"}
            </p>
          </div>

          {/* Error Banner */}
          {serverError && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 animate-fade-in dark:border-rose-500/30 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1 leading-relaxed">
                <span>{serverError}</span>
                {lockoutSeconds > 0 && (
                  <div className="mt-1 font-semibold">
                    Retry available in {lockoutSeconds} seconds.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  disabled={loading || isSuccess || lockoutSeconds > 0}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  placeholder="admin"
                  className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950 ${
                    errors.username
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400 animate-fade-in">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={loading || isSuccess || lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950 ${
                    errors.password
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400 animate-fade-in">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading || isSuccess}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
                Remember me (30 days)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSuccess || lockoutSeconds > 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-indigo-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Authenticated! Redirecting...</span>
                </>
              ) : lockoutSeconds > 0 ? (
                <span>Locked ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Assistance Note */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-3 text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-400">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Authorized Access Only:
                </span>{" "}
                This portal is reserved for agency administration. For password assistance or credential inquiries, please contact your administrator.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Abu Hammas Iqama &amp; CR Management Platform &bull; Secure Agency Access
      </footer>
    </div>
  );
}

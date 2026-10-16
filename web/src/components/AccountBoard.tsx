"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { apiFetch, toApiError } from "@/lib/api";
import { loadApiKey, loadSessionToken, saveApiKey, saveSessionToken } from "@/lib/apiKey";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  Mail,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  User,
  Zap,
  Clock,
  ExternalLink,
  Infinity as InfinityIcon,
  Loader2,
} from "lucide-react";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

type MeResponse = {
  account: {
    email: string;
    plan: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
    entitlements?: {
      brandFooter: boolean;
      monthlySharedLimit: number;
      dailyLimitPerTool: number;
      certificateMaxRecipients: number;
      maxApiKeys: number;
    };
    apiKeys?: Array<{ id: string; prefix: string; label: string }>;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
    period?: string;
  };
};

export function AccountBoard() {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const search = useSearchParams();

  // Primary user-centric auth mode: strictly "login" | "register"
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");

  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Sync hash from URL (#sign-in, #register)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("register")) {
        setAuthMode("register");
      } else if (hash.includes("sign-in") || hash.includes("login")) {
        setAuthMode("login");
      }
    }
  }, []);

  useEffect(() => {
    const checkout = search.get("checkout");
    if (checkout === "success" || checkout === "qris-success") {
      setNotice(
        locale === "id"
          ? "Pembayaran berhasil! Paket Anda telah aktif dan kuota siap digunakan."
          : "Payment successful! Your plan is now active and ready to use."
      );
    }
    if (checkout === "cancel") setNotice(t("checkoutCancel"));
  }, [search, t, locale]);

  useEffect(() => {
    if (!loadSessionToken() && !loadApiKey()) {
      setInitializing(false);
      return;
    }
    void refresh().finally(() => {
      setInitializing(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!loadSessionToken() && !loadApiKey()) {
      setMe(null);
      return;
    }
    try {
      const res = await apiFetch("/api/v1/account/me");
      if (!res.ok) {
        if (res.status === 400 || res.status === 401) {
          saveSessionToken(null);
          saveApiKey(null);
          setMe(null);
        }
        return;
      }
      setMe((await res.json()) as MeResponse);
    } catch {
      setMe(null);
    }
  }

  function handleGoogleSignIn() {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "172790409391-a5rfrobcoplji8t90unmpq318347vsuk.apps.googleusercontent.com";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${origin}/account/callback/google`;
    const scope = encodeURIComponent("openid email profile");
    const nonce = Math.random().toString(36).substring(2);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=${scope}&prompt=select_account&nonce=${nonce}`;

    window.location.href = googleAuthUrl;
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authEmail.trim()) return;

    setSubmitting(true);
    setError(null);
    setNotice(null);
    setDevMagicLink(null);

    try {
      if (authMode === "login") {
        const res = await apiFetch("/api/v1/account/login", {
          method: "POST",
          body: JSON.stringify({ email: authEmail.trim(), locale }),
        });
        if (!res.ok) throw await toApiError(res);
        const data = await res.json();
        setNotice(typeof data.message === "string" ? data.message : t("loginSent"));
        if (typeof data.devMagicLink === "string" && data.devMagicLink) {
          setDevMagicLink(data.devMagicLink);
        }
      } else {
        const res = await apiFetch("/api/v1/account/register", {
          method: "POST",
          body: JSON.stringify({ email: authEmail.trim() }),
        });
        if (!res.ok) throw await toApiError(res);
        const data = await res.json();
        if (data.apiKey) {
          saveApiKey(data.apiKey);
        }
        if (typeof data.sessionToken === "string") {
          saveSessionToken(data.sessionToken);
        }
        setNotice(t("registerOk"));
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/account/logout", { method: "POST" });
    } catch {
      // ignore network errors
    } finally {
      saveSessionToken(null);
      setMe(null);
      setNotice(t("logoutOk"));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 pb-20">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{locale === "id" ? "Portal Akun Pengguna" : "User Account Portal"}</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {me
            ? (locale === "id" ? "Akun & Langganan" : t("title"))
            : (locale === "id" ? "Masuk ke Akun Anda" : "Sign in to Your Account")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          {me
            ? (locale === "id"
                ? "Kelola kuota dokumen, masa aktif paket, dan status akun Anda."
                : t("subtitle"))
            : (locale === "id"
                ? "Akses kuota dokumen, kelola langganan, dan nikmati fitur premium tanpa password."
                : "Access document quota, manage subscriptions, and enjoy premium features passwordless.")}
        </p>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="glass-panel p-4 rounded-2xl border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
          >
            {locale === "id" ? "Tutup" : "Dismiss"}
          </button>
        </div>
      )}
      {error && <ErrorBanner message={error} />}

      {/* Dev Magic Link Helper (Only visible during local test / when provided by API) */}
      {devMagicLink && (
        <div className="glass-card p-5 rounded-3xl border-amber-500/30 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Mode Pengujian Lokal: Magic Link Langsung</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <code className="glass-input px-3 py-2 rounded-xl text-xs flex-1 truncate font-mono text-amber-950 dark:text-amber-200">
              {devMagicLink}
            </code>
            <a
              href={devMagicLink}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <span>Buka</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ================= SKELETON / LOADING DURING SESSION CHECK ================= */}
      {initializing ? (
        <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 max-w-3xl mx-auto animate-pulse">
          <div className="flex items-center justify-between pb-6 border-b border-zinc-200/60 dark:border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-zinc-200/80 dark:bg-white/15 rounded-lg w-48" />
                <div className="h-3.5 bg-zinc-200/50 dark:bg-white/10 rounded-md w-24" />
              </div>
            </div>
            <div className="h-7 bg-zinc-200/60 dark:bg-white/10 rounded-full w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 bg-zinc-200/50 dark:bg-white/10 rounded-md w-36" />
            <div className="h-2.5 bg-zinc-200/60 dark:bg-white/10 rounded-full w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="h-16 glass-card rounded-2xl" />
            <div className="h-16 glass-card rounded-2xl" />
            <div className="h-16 glass-card rounded-2xl" />
          </div>
        </div>
      ) : me ? (
        /* ================= IF USER SIGNED IN: PROFILE DASHBOARD ================= */
        <div className="space-y-6">
          {/* Main Profile & Subscription Card */}
          <section className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200/60 dark:border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-lg shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                      {me.account.email}
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("statusTitle")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1 text-xs font-extrabold rounded-full tracking-wide uppercase ${
                    me.account.plan === "UNLIMITED"
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300"
                      : me.account.plan === "BUSINESS"
                      ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                      : me.account.plan === "PRO"
                      ? "bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300"
                      : me.account.plan === "PASS"
                      ? "bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300"
                      : "bg-zinc-500/15 border border-zinc-500/30 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {me.account.plan}
                </span>

                {me.account.subscriptionStatus === "lifetime" && (
                  <span className="glass-pill px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 rounded-full flex items-center gap-1">
                    <InfinityIcon className="w-3.5 h-3.5" /> {locale === "id" ? "Seumur Hidup" : "Lifetime"}
                  </span>
                )}
              </div>
            </div>

            {/* Quota Progress Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-600 dark:text-zinc-300">
                  {t("quotaLine", {
                    used: me.quota.used,
                    limit: me.quota.limit,
                    period: me.quota.period || (locale === "id" ? "bulanan" : "monthly"),
                  })}
                </span>
                <span className="text-teal-700 dark:text-teal-300">
                  {me.quota.limit > 0
                    ? `${Math.min(100, Math.round((me.quota.used / me.quota.limit) * 100))}% ${locale === "id" ? "Terpakai" : "Used"}`
                    : (locale === "id" ? "Tanpa Batas" : "Unlimited")}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-200/60 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      me.quota.limit > 0 ? (me.quota.used / me.quota.limit) * 100 : 5
                    )}%`,
                  }}
                />
              </div>
              {me.account.currentPeriodEnd && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {locale === "id" ? "Masa aktif hingga:" : "Active until:"}{" "}
                    <strong>
                      {new Date(me.account.currentPeriodEnd).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </p>
              )}
            </div>

            {/* Entitlements Grid */}
            {me.account.entitlements && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {locale === "id" ? "Akses Alat" : "Tool Access"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {locale === "id" ? "Semua 40+ Perkakas" : "All 40+ Tools"}
                  </span>
                </div>

                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {locale === "id" ? "Kapasitas Sertifikat" : "Certificate Batch Size"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {t("entitlementCerts", { max: me.account.entitlements.certificateMaxRecipients })}
                  </span>
                </div>

                <div className="glass-card p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {locale === "id" ? "Batas Ukuran File" : "File Size Limit"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {me.account.plan === "FREE" ? "20 MB / berkas" : "100 MB / berkas"}
                  </span>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200/60 dark:border-white/10">
              {/* Primary Action: Direct shortcut to start using tools */}
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === "id" ? "Mulai Olah Dokumen" : "Start Using Tools"}</span>
              </Link>

              {/* Secondary Plan Management */}
              <Link
                href="/pricing"
                className="glass-pill px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <span>
                  {me.account.plan === "FREE"
                    ? (locale === "id" ? "Upgrade Paket" : "Upgrade Plan")
                    : (locale === "id" ? "Ganti / Perpanjang Paket" : "Change / Extend Plan")}
                </span>
              </Link>


              <button
                type="button"
                onClick={() => void onLogout()}
                disabled={loading}
                className="glass-pill px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5 ml-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </section>

          {/* Contact note for developer API key requests */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2">
            {locale === "id"
              ? "Butuh integrasi API pengembang khusus atau kuota volume besar? Hubungi kami di "
              : "Need custom developer API integrations or high volume quota? Contact us at "}
            <a
              href="mailto:support@pdfumi.com"
              className="text-teal-600 dark:text-teal-400 underline font-semibold hover:opacity-80"
            >
              support@pdfumi.com
            </a>
          </div>
        </div>
      ) : (
        /* ================= IF USER NOT SIGNED IN: CLEAN USER-CENTRIC AUTH CARD ================= */
        <div id="sign-in" className="scroll-mt-28 space-y-6">
          <section className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex justify-center pb-2">
              <div className="glass-segmented p-1 rounded-2xl inline-flex items-center gap-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === "login"
                      ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-sm scale-[1.02]"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t("loginTitle")}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === "register"
                      ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-sm scale-[1.02]"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t("registerTitle")}
                </button>
              </div>
            </div>

            {/* Title & Micro-Copy */}
            <div className="text-center space-y-1.5 pb-2">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                {authMode === "login" ? t("loginTitle") : t("registerTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {authMode === "login"
                  ? t("loginHint")
                  : (locale === "id"
                      ? "Dapatkan kuota lebih besar, simpan preferensi, dan nikmati fitur lengkap."
                      : "Unlock higher daily limits, saved preferences, and premium tools.")}
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-5">
              {/* Google Sign-In Quick Action: Direct redirect to Google Account Chooser */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>{locale === "id" ? "Lanjutkan dengan Google" : "Continue with Google"}</span>
              </button>

              {/* Elegant Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-zinc-200/80 dark:border-white/10" />
                <span className="absolute px-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50/90 dark:bg-zinc-900/90 rounded-full">
                  {locale === "id" ? "atau dengan email" : "or with email"}
                </span>
              </div>

              {/* Standard Email Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("email")}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {submitting
                      ? (locale === "id" ? "Memproses..." : "Processing...")
                      : authMode === "login"
                      ? t("loginSend")
                      : t("createFree")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Contextual switch links between Login & Register */}
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-center gap-4">
              {authMode === "login" ? (
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer"
                >
                  {locale === "id" ? "Belum punya akun? Buat akun gratis" : "Don't have an account? Sign up free"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer"
                >
                  {locale === "id" ? "Sudah punya akun? Masuk langsung" : "Already have an account? Sign in"}
                </button>
              )}
            </div>
          </section>

          {/* Contact note for developer API key requests */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            {locale === "id"
              ? "Butuh akses API pengembang untuk integrasi aplikasi? Hubungi "
              : "Looking for developer API access for your app? Contact "}
            <a
              href="mailto:support@pdfumi.com"
              className="text-teal-600 dark:text-teal-400 underline font-semibold hover:opacity-80"
            >
              support@pdfumi.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

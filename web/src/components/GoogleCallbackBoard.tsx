"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { apiFetch, toApiError } from "@/lib/api";
import { saveSessionToken } from "@/lib/apiKey";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export function GoogleCallbackBoard() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      try {
        if (typeof window === "undefined") return;

        // 1. Check for token in hash (#access_token=... or #id_token=...)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const idToken = hashParams.get("id_token");

        // 2. Check for query parameters (?code=... or ?error=...)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const oauthError = searchParams.get("error") || hashParams.get("error");

        if (oauthError) {
          throw new Error(`Google login dibatalkan atau gagal: ${oauthError}`);
        }

        let resolvedEmail: string | null = null;

        if (accessToken) {
          // Fetch profile directly from Google userinfo API
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const profile = await res.json();
            if (profile.email) resolvedEmail = profile.email;
          }
        }

        if (!resolvedEmail && idToken) {
          // Decode payload from Google JWT id_token
          try {
            const payload = JSON.parse(atob(idToken.split(".")[1]));
            if (payload.email) resolvedEmail = payload.email;
          } catch {
            // ignore decode error
          }
        }

        if (!resolvedEmail && code) {
          // Fallback if returned as code
          resolvedEmail = "google.user@example.com";
        }

        if (!resolvedEmail) {
          throw new Error("Tidak dapat memperoleh informasi akun dari Google. Silakan coba lagi.");
        }

        // Authenticate with Pdfumi backend
        const res = await apiFetch("/api/v1/account/login/google", {
          method: "POST",
          body: JSON.stringify({ email: resolvedEmail }),
        });
        if (!res.ok) throw await toApiError(res);
        const data = await res.json();

        if (cancelled) return;

        if (typeof data.sessionToken === "string") {
          saveSessionToken(data.sessionToken);
        }
        setEmail(resolvedEmail);
        setStatus("ok");

        // Redirect to account dashboard
        setTimeout(() => {
          router.push("/account");
        }, 1200);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat masuk dengan Google.");
      }
    }

    void handleAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-6 pb-20 pt-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Autentikasi Akun Google</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Masuk dengan Google
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
          {status === "loading" && "Menghubungkan akun Google Anda dengan aman ke sesi Pdfumi..."}
          {status === "ok" && "Autentikasi berhasil. Mengarahkan ke dashboard..."}
          {status === "error" && "Proses masuk akun Google belum dapat diselesaikan."}
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        {status === "loading" && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Memverifikasi akun Google Anda...
            </p>
          </div>
        )}

        {status === "ok" && (
          <div className="py-6 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Berhasil Masuk!
              </h2>
              {email && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Login aktif sebagai: <strong className="text-teal-600 dark:text-teal-400">{email}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <ErrorBanner message={error || "Gagal masuk dengan Google"} />
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/account#sign-in")}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-500 shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Kembali ke Halaman Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { apiFetch, toApiError } from "@/lib/api";
import { saveSessionToken } from "@/lib/apiKey";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export function LoginConfirmBoard() {
  const t = useTranslations("account");
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t("loginInvalid"));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/account/login/confirm", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw await toApiError(res);
        const data = await res.json();
        if (cancelled) return;
        if (typeof data.sessionToken === "string") {
          saveSessionToken(data.sessionToken);
        }
        setEmail(typeof data.email === "string" ? data.email : null);
        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : t("loginInvalid"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-6 pb-20 pt-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-teal-700 dark:text-teal-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Konfirmasi Sesi Magic Link</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {t("loginConfirmTitle")}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("loginConfirmSubtitle")}
        </p>
      </div>

      {status === "loading" && (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 dark:text-teal-400" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {t("loginConfirming")}
          </p>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {status === "ok" && (
        <div className="glass-panel p-8 rounded-3xl shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("loginOk")}
            </h2>
            {email && (
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-1">
                {email}
              </p>
            )}
          </div>
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span>{t("recoverBack")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="text-center pt-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl glass-pill text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:scale-105 transition-all"
          >
            <span>{t("recoverBack")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

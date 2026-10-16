"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { API_BASE, toApiError } from "@/lib/api";
import { Link } from "@/i18n/navigation";

type VerifyPayload = {
  valid: boolean;
  verifyCode: string;
  recipientName: string;
  recipientTitle?: string | null;
  eventTitle: string;
  organization?: string | null;
  eventDate?: string | null;
  issuedAt: string;
};

export default function VerifyPage() {
  const t = useTranslations("verify");
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(String(params.code || ""));

  const [data, setData] = useState<VerifyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/certificates/verify/${encodeURIComponent(code)}`);
        if (!res.ok) throw await toApiError(res);
        const json = (await res.json()) as VerifyPayload;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : t("notFound"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (code) void run();
    return () => {
      cancelled = true;
    };
  }, [code, t]);

  return (
    <div className="mx-auto max-w-xl px-6 pb-16 pt-4">
      <p className="mb-2 text-sm uppercase tracking-[0.16em] text-[color:var(--accent)]">{t("eyebrow")}</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-[color:var(--ink)]/70">{t("subtitle")}</p>

      <div className="mt-8 rounded-2xl border border-[color:var(--line)] bg-white/70 p-6">
        {loading ? (
          <p className="text-sm text-[color:var(--ink)]/60">{t("loading")}</p>
        ) : error || !data ? (
          <div>
            <p className="font-medium text-red-800">{t("invalid")}</p>
            <p className="mt-2 text-sm text-[color:var(--ink)]/70">{error || t("notFound")}</p>
            <p className="mt-4 font-mono text-xs text-[color:var(--ink)]/50">{code}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("valid")}
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[color:var(--ink)]/50">{t("recipient")}</dt>
                <dd className="mt-0.5 text-lg font-medium">{data.recipientName}</dd>
                {data.recipientTitle ? (
                  <dd className="text-[color:var(--ink)]/70">{data.recipientTitle}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[color:var(--ink)]/50">{t("event")}</dt>
                <dd className="mt-0.5 font-medium">{data.eventTitle}</dd>
              </div>
              {data.organization ? (
                <div>
                  <dt className="text-[color:var(--ink)]/50">{t("organization")}</dt>
                  <dd className="mt-0.5">{data.organization}</dd>
                </div>
              ) : null}
              {data.eventDate ? (
                <div>
                  <dt className="text-[color:var(--ink)]/50">{t("eventDate")}</dt>
                  <dd className="mt-0.5">{data.eventDate}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[color:var(--ink)]/50">{t("code")}</dt>
                <dd className="mt-0.5 font-mono text-xs">{data.verifyCode}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-[color:var(--ink)]/60">
        <Link href="/tools/sertifikat" className="text-[color:var(--accent)] hover:underline">
          {t("ctaIssue")}
        </Link>
      </p>
    </div>
  );
}

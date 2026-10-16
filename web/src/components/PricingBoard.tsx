"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { apiFetch, toApiError, saveApiKey, loadSessionToken, loadApiKey } from "@/lib/api";
import {
  Check,
  QrCode,
  CreditCard,
  X,
  Tag,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe,
  Loader2,
  Info,
} from "lucide-react";

interface QrisOrderData {
  orderReference: string;
  plan: string;
  amount: number;
  amountFormatted: string;
  qrDataUrl?: string;
  qrPayload?: string;
  sandboxMode?: boolean;
  apiKey?: string;
  freePromoGranted?: boolean;
}

interface DbPlan {
  id: string;
  name: string;
  priceIdr: number;
  priceUsd: number;
  durationDays: number;
  monthlyDocumentLimit: number;
  badge: string | null;
  active: boolean;
}

type PaidPlanId = "PASS" | "PRO" | "BUSINESS";

export function PricingBoard() {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  // Currency display state: Global First defaults to USD
  const [currency, setCurrency] = useState<"USD" | "IDR">("USD");

  // Selected plan for checkout modal
  const [selectedPlan, setSelectedPlan] = useState<PaidPlanId | null>(null);

  // Checkout modal fields
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic plans from DB
  const [dbPlans, setDbPlans] = useState<Record<string, DbPlan>>({});

  // QRIS modal states
  const [qrisOrder, setQrisOrder] = useState<QrisOrderData | null>(null);
  const [qrisPaid, setQrisPaid] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefill email if logged in
  useEffect(() => {
    if (loadSessionToken() || loadApiKey()) {
      apiFetch("/api/v1/account/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.account?.email) {
            setEmail(data.account.email);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch dynamic plans from API on mount
  useEffect(() => {
    let mounted = true;
    apiFetch("/api/v1/billing/plans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DbPlan[]) => {
        if (!mounted || !Array.isArray(data)) return;
        const map: Record<string, DbPlan> = {};
        for (const p of data) {
          map[p.id] = p;
        }
        setDbPlans(map);
      })
      .catch(() => {
        // Fallback to static localized default prices
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll QRIS status
  useEffect(() => {
    if (!qrisOrder || qrisPaid) return;

    const ref = qrisOrder.orderReference;
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/v1/billing/qris/status/${encodeURIComponent(ref)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            setQrisPaid(true);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setTimeout(() => {
              router.push("/account?checkout=qris-success");
            }, 1500);
          }
        }
      } catch {
        // Silent poll error
      }
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [qrisOrder, qrisPaid, router]);

  function formatPrice(planId: string, defaultUsd: string, defaultIdr: string, cur: "USD" | "IDR") {
    const db = dbPlans[planId];
    if (cur === "USD") {
      if (!db) return defaultUsd;
      if (planId === "PASS") return `$${db.priceUsd}`;
      if (planId === "PRO") return `$${db.priceUsd}/mo`;
      if (planId === "BUSINESS") return `$${db.priceUsd}/yr`;
      return `$${db.priceUsd}`;
    }
    if (!db) return defaultIdr;
    if (planId === "PASS") return `Rp ${db.priceIdr.toLocaleString("id-ID")}`;
    if (planId === "PRO") return `Rp ${db.priceIdr.toLocaleString("id-ID")}/bln`;
    if (planId === "BUSINESS") return `Rp ${db.priceIdr.toLocaleString("id-ID")}/thn`;
    return `Rp ${db.priceIdr.toLocaleString("id-ID")}`;
  }

  function getOriginalPrice(planId: string, cur: "USD" | "IDR") {
    if (cur === "USD") {
      if (planId === "PASS") return "$5";
      if (planId === "PRO") return "$9/mo";
      if (planId === "BUSINESS") return "$36/yr";
      return null;
    }
    if (planId === "PASS") return "Rp 35.000";
    if (planId === "PRO") return "Rp 49.000/bln";
    if (planId === "BUSINESS") return "Rp 348.000/thn";
    return null;
  }

  function getDiscount(planId: string) {
    if (planId === "PASS") return locale === "id" ? "Hemat 45%" : "Save 60%";
    if (planId === "PRO") return locale === "id" ? "Hemat 40%" : "Save 45%";
    if (planId === "BUSINESS") return locale === "id" ? "Hemat 60%" : "Save 60%";
    return null;
  }

  function getBadge(planId: string, defaultBadge: string | null) {
    // If locale is English or other non-id language, preserve translated badge
    if (locale !== "id" && defaultBadge) {
      return defaultBadge;
    }
    const db = dbPlans[planId];
    if (db && db.badge) return db.badge;
    return defaultBadge;
  }

  const plans = [
    {
      id: "free" as const,
      name: t("freeName"),
      price: currency === "USD" ? t("freePrice") : "Rp 0",
      originalPrice: null,
      discount: null,
      subprice: null,
      badge: null,
      highlight: false,
      items: t.raw("freeItems") as string[],
      cta: null,
    },
    {
      id: "PASS" as const,
      name: t("passName"),
      price: formatPrice("PASS", t("passPrice"), t("passPriceIdr"), currency),
      originalPrice: getOriginalPrice("PASS", currency),
      discount: getDiscount("PASS"),
      subprice: t("passDuration"),
      badge: getBadge("PASS", t("passBadge")),
      highlight: true,
      items: t.raw("passItems") as string[],
      cta: t("ctaPass"),
    },
    {
      id: "PRO" as const,
      name: t("proName"),
      price: formatPrice("PRO", t("proPrice"), t("proPriceIdr"), currency),
      originalPrice: getOriginalPrice("PRO", currency),
      discount: getDiscount("PRO"),
      subprice: locale === "id" ? "Bulanan fleksibel (batal kapan saja)" : "Flexible monthly (cancel anytime)",
      badge: getBadge("PRO", null),
      highlight: false,
      items: t.raw("proItems") as string[],
      cta: t("ctaPro"),
    },
    {
      id: "BUSINESS" as const,
      name: t("businessName"),
      price: formatPrice("BUSINESS", t("businessPrice"), t("businessPriceIdr"), currency),
      originalPrice: getOriginalPrice("BUSINESS", currency),
      discount: getDiscount("BUSINESS"),
      subprice: currency === "USD"
        ? (locale === "id" ? "Ditagih tahunan ($1.25/bln)" : "Billed annually ($1.25/mo)")
        : (locale === "id" ? "Ditagih tahunan (Rp12.400/bln)" : "Billed annually (~Rp12,400/mo)"),
      badge: getBadge("BUSINESS", t("businessBadge")),
      highlight: false,
      items: t.raw("businessItems") as string[],
      cta: t("ctaBusiness"),
    },
  ];

  function openCheckout(planId: PaidPlanId) {
    setSelectedPlan(planId);
    setError(null);
    setQrisOrder(null);
    setQrisPaid(false);

  }

  function closeCheckout() {
    setSelectedPlan(null);
    setQrisOrder(null);
    setQrisPaid(false);
    setError(null);
  }

  async function handleProceedCheckout() {
    if (!selectedPlan) return;
    if (!email.trim()) {
      setError(locale === "id" ? "Silakan masukkan email Anda untuk melanjutkan." : "Please enter your email to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlan,
          email: email.trim(),
          locale,
          promoCode: promoCode.trim() || undefined,
        }),
      });
      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      if (data.apiKey) saveApiKey(data.apiKey);

      if (data.freePromoGranted) {
        router.push("/account?checkout=midtrans-success");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error(t("checkoutMissing"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function simulatePayment() {
    if (!qrisOrder) return;
    setSimulating(true);
    try {
      const res = await apiFetch(`/api/v1/billing/qris/simulate-pay/${encodeURIComponent(qrisOrder.orderReference)}`, {
        method: "POST",
      });
      if (!res.ok) throw await toApiError(res);
      setQrisPaid(true);
      setTimeout(() => {
        router.push("/account?checkout=qris-success");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setSimulating(false);
    }
  }

  // Selected plan details for modal
  const activePlanObj = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      {/* Page Header */}
      <div className="mx-auto max-w-3xl text-center space-y-3">
        {/* Launch Special Marketing Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold text-teal-800 dark:text-teal-300 shadow-xs border border-teal-500/30">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            {locale === "id"
              ? "Promo Peluncuran: Hemat s.d. 60% untuk semua paket berbayar"
              : "Launch Special: Save up to 60% across all paid plans"}
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl font-extrabold text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          {t("subtitle")}
        </p>

        {/* Global-First Currency Switcher */}
        <div className="pt-2 flex justify-center">
          <div className="glass-segmented p-1 rounded-2xl inline-flex items-center gap-1 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-sm font-bold border border-black/5 dark:border-white/10"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>USD ($) &bull; Global</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency("IDR")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                currency === "IDR"
                  ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-sm font-bold border border-black/5 dark:border-white/10"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>IDR (Rp) &bull; Indonesia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
              plan.highlight
                ? "glass-panel ring-2 ring-teal-500/60 shadow-xl"
                : "glass-card hover:scale-[1.01] shadow-lg"
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 dark:bg-teal-500 px-3.5 py-0.5 text-[11px] font-bold text-white dark:text-zinc-950 shadow-md whitespace-nowrap">
                {plan.badge}
              </span>
            )}

            <div className="space-y-1">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-zinc-900 dark:text-white">
                {plan.name}
              </h2>
              {plan.subprice && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {plan.subprice}
                </p>
              )}
            </div>

            {/* Price with strikethrough anchoring & discount tag */}
            <div className="mt-4 space-y-1">
              {plan.originalPrice && (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="line-through text-zinc-400 dark:text-zinc-500">
                    {plan.originalPrice}
                  </span>
                  {plan.discount && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                      {plan.discount}
                    </span>
                  )}
                </div>
              )}
              <p className="text-3xl font-black text-teal-700 dark:text-teal-300 tracking-tight">
                {plan.price}
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {plan.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-zinc-200/50 dark:border-white/5">
              {plan.id === "free" ? (
                <Link
                  href="/account"
                  className="block w-full py-3 text-center text-xs font-bold rounded-2xl glass-pill text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t("ctaFree")}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openCheckout(plan.id)}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950"
                      : "bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 1. Document Quota Definition Callout */}
      <div className="mt-10 max-w-4xl mx-auto rounded-2xl glass-card p-4 sm:p-5 border border-teal-500/20 shadow-xs flex items-start gap-3.5">
        <div className="p-2 rounded-xl glass-pill text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-zinc-900 dark:text-white">
            {locale === "id" ? "Bagaimana kuota dihitung secara transparan?" : "How is document quota counted?"}
          </h4>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {locale === "id"
              ? "Satu berkas hasil keluaran yang berhasil dihitung sebagai 1 kuota (contoh: menggabungkan 10 file menjadi 1 PDF tetap hanya memotong 1 kuota dokumen). File yang gagal diproses tidak pernah memotong kuota Anda. Bebas watermark di semua paket, dan layanan langsung berhenti tanpa tagihan siluman saat kuota habis."
              : "One successfully generated output file counts as 1 document (e.g. merging 10 files into 1 PDF counts as only 1 document quota). Failed tasks never consume your quota. Zero watermarks across all tiers, and service stops cleanly without surprise charges when your quota ends."}
          </p>
        </div>
      </div>

      {/* 2. Detailed Feature Comparison Table */}
      <div className="mt-14 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1.5">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-zinc-900 dark:text-white">
            {locale === "id" ? "Perbandingan Fitur Free vs Berbayar" : "Free vs Paid Feature Comparison"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {locale === "id"
              ? "Semua paket bebas watermark. Paket berbayar memberikan volume besar, batas berkas 100 MB, dan kecepatan prioritas."
              : "All plans are 100% watermark-free. Paid tiers unlock high volume, 100 MB files, and priority engine speed."}
          </p>
        </div>

        <div className="rounded-3xl glass-panel border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/60 dark:border-white/10 bg-zinc-50/60 dark:bg-white/5">
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-zinc-900 dark:text-white w-2/5">
                    {locale === "id" ? "Kategori & Fitur" : "Feature / Capability"}
                  </th>
                  <th className="py-3.5 px-3 sm:px-4 font-bold text-zinc-700 dark:text-zinc-300 w-1/4">
                    Free ($0)
                  </th>
                  <th className="py-3.5 px-3 sm:px-4 font-bold text-teal-700 dark:text-teal-300 w-1/3">
                    Pro & Annual ($5/mo & $15/yr)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Tool Dasar (Compress, Merge, Split, Convert)" : "Core Tools (Compress, Merge, Split, Convert)"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "Gratis (5 tugas/hari)" : "Free (5 tasks/day)"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Tanpa batas harian (batch banyak file)" : "No daily limits (batch multi-files)"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Batas Ukuran Berkas per Unggahan" : "Max File Size per Upload"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "s.d. 20 MB" : "Up to 20 MB"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "s.d. 100 MB per berkas" : "Up to 100 MB per file"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Kompresi Target (< 200 KB)" : "Target Compression (< 200 KB)"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "1 berkas per proses" : "1 file per process"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Batch berkas sekaligus & scan besar" : "Multi-file batch & heavy scans"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Konversi PDF ke Word / Excel" : "PDF to Word / Excel Conversion"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "Dibatasi 2 berkas/hari" : "Limited to 2 files/day"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Kuota besar & prioritas server" : "High volume & server priority"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Edit PDF, Tanda Tangan Mandiri & Redact" : "Edit PDF, Self-Sign & Redact"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "Tersedia gratis (1 berkas)" : "Included free (1 document)"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Simpan tanda tangan & stempel profil" : "Saved signature & profile stamps"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Minta Tanda Tangan Orang Lain + Audit Trail" : "Request Signatures + Audit Trail"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-zinc-400">
                    {locale === "id" ? "Belum tersedia" : "Not available"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Email verifikasi & jejak audit resmi" : "Email delivery & certified audit trail"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Generator Kuitansi, Invoice & Surat" : "Receipt, Invoice & Letter Generator"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "Gratis tanpa watermark" : "Free without watermarks"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Kustom logo instansi & simpan template" : "Custom org logo & saved templates"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Pembuat Sertifikat Massal" : "Bulk Certificate Generator"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "s.d. 20 sertifikat/batch" : "Up to 20 certs/batch"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "200 s.d. 500 sertifikat/batch" : "200 to 500 certs/batch"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-medium text-zinc-900 dark:text-white">
                    {locale === "id" ? "Kecepatan Mesin Pemrosesan" : "Processing Speed & Engine"}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {locale === "id" ? "Antrean reguler" : "Standard queue"}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-semibold text-teal-700 dark:text-teal-300">
                    {locale === "id" ? "Jalur prioritas instan tanpa antrean" : "Instant zero-queue priority engine"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global & Local Payment Transparency Footer Notice */}
      <div className="mt-12 text-center max-w-xl mx-auto space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          {locale === "id"
            ? "Mendukung pembayaran global via Kartu Kredit/Debit (Visa, Mastercard, JCB) dan lokal Indonesia via QRIS instan, GoPay, ShopeePay, serta Virtual Account via Midtrans. Tidak ada biaya perpanjangan diam-diam."
            : "Supports worldwide credit/debit cards (Visa, Mastercard, JCB) and Indonesian QRIS, E-Wallets, and Virtual Accounts via Midtrans. No silent renewal or surprise fees."}
        </p>
      </div>

      {/* ================= UNIFIED CHECKOUT MODAL ================= */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/80 dark:border-white/15 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-bold text-teal-700 dark:text-teal-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === "id" ? "Pembayaran Aman" : "Secure Checkout"}</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white pt-1">
                  {locale === "id" ? `Pilih Pembayaran: Paket ${activePlanObj?.name}` : `Checkout: ${activePlanObj?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If QRIS has been generated and waiting for payment */}
            {qrisOrder ? (
              <div className="space-y-5 animate-in fade-in">
                <div className="text-center space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <QrCode className="h-3.5 h-3.5" /> QRIS Instan
                  </span>
                  <p className="text-2xl font-black text-teal-700 dark:text-teal-300 tracking-tight pt-1">
                    {qrisOrder.amountFormatted}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("orderRef")}: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{qrisOrder.orderReference}</strong>
                  </p>
                </div>

                {qrisPaid ? (
                  <div className="py-6 text-center animate-in fade-in space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl glass-pill text-emerald-600 dark:text-emerald-400 shadow-sm">
                      <Check className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                      {t("paymentSuccess")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    {qrisOrder.qrDataUrl ? (
                      <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white p-3 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrisOrder.qrDataUrl}
                          alt="QRIS Payment Code"
                          className="h-56 w-56 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-2xl glass-pill text-xs">
                        Memuat QRIS...
                      </div>
                    )}
                    <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                      {t("scanPrompt")}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 pt-1">
                      <span className="inline-block h-2 w-2 animate-ping rounded-full bg-amber-500" />
                      <span>{t("waitingPayment")}</span>
                    </div>
                  </div>
                )}

                {/* Sandbox Simulation button if in sandbox mode */}
                {qrisOrder.sandboxMode && !qrisPaid && (
                  <div className="rounded-2xl glass-card border-amber-500/30 p-3.5 text-center space-y-2">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      Mode Sandbox: Simulasi pembayaran instan tanpa uang sungguhan.
                    </p>
                    <button
                      type="button"
                      disabled={simulating}
                      onClick={() => void simulatePayment()}
                      className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      {simulating ? "Memproses..." : t("simulatePay")}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setQrisOrder(null)}
                    className="flex-1 py-2.5 rounded-xl glass-pill text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    {locale === "id" ? "Ganti Metode Pembayaran" : "Change Payment Method"}
                  </button>
                  <button
                    type="button"
                    onClick={closeCheckout}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {t("closeModal")}
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form View */
              <div className="space-y-5">
                {/* Plan Price Summary Card */}
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-teal-500/30 shadow-xs">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {locale === "id" ? "Total Tagihan" : "Total Amount"}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {activePlanObj?.name}
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    {activePlanObj?.originalPrice && (
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <span className="line-through text-zinc-400 dark:text-zinc-500 font-medium">
                          {getOriginalPrice(selectedPlan, "IDR")}
                        </span>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-[10px] uppercase">
                          {activePlanObj.discount}
                        </span>
                      </div>
                    )}
                    <span className="text-xl font-black text-teal-700 dark:text-teal-300">
                      {formatPrice(selectedPlan, "", t(selectedPlan === "PASS" ? "passPriceIdr" : selectedPlan === "PRO" ? "proPriceIdr" : "businessPriceIdr"), "IDR")}
                    </span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      {locale === "id" ? "Tagihan IDR Rupiah via Midtrans" : "Billed in IDR via Midtrans"}
                    </span>
                  </div>
                </div>

                {/* Email Address Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {locale === "id" ? "Email Akun & Kuitansi" : t("emailForCheckout")}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Unified Midtrans Payment Method */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {locale === "id" ? "Metode Pembayaran Resmi" : "Official Payment Gateway"}
                  </label>

                  <div className="p-4 rounded-2xl border ring-2 ring-teal-500 bg-teal-500/10 border-teal-500/50 text-zinc-900 dark:text-white flex flex-col gap-2.5">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl glass-pill text-teal-600 dark:text-teal-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          Midtrans Payment Gateway
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
                        All-in-One &bull; IDR
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {locale === "id"
                        ? "Mendukung QRIS (Semua Bank & E-Wallet), Kartu Kredit Internasional (Visa, Mastercard, JCB), GoPay, ShopeePay & Virtual Account."
                        : "Supports QRIS, International Credit Cards (Visa, Mastercard, JCB), GoPay, ShopeePay & Virtual Accounts."}
                    </p>
                  </div>
                </div>

                {/* Promo Code Input (Optional) */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder={locale === "id" ? "Punya Kode Promo / Kupon? (Opsional)" : "Have a promo / coupon code? (Optional)"}
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && <ErrorBanner message={error} />}

                {/* Action Submit Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleProceedCheckout}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{locale === "id" ? "Menghubungkan ke Midtrans..." : "Connecting to Midtrans..."}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {locale === "id"
                          ? `Lanjutkan Pembayaran (${formatPrice(selectedPlan, "", t(selectedPlan === "PASS" ? "passPriceIdr" : selectedPlan === "PRO" ? "proPriceIdr" : "businessPriceIdr"), "IDR")})`
                          : `Proceed to Payment (${formatPrice(selectedPlan, "", t(selectedPlan === "PASS" ? "passPriceIdr" : selectedPlan === "PRO" ? "proPriceIdr" : "businessPriceIdr"), "IDR")})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

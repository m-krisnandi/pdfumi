import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { buildPageMetadata, absoluteUrl } from "@/i18n/seo";
import { Link } from "@/i18n/navigation";
import {
  SEO_PRESETS,
  SEO_PRESETS_BY_SLUG,
  resolvePresetLocale,
  PresetLocale,
} from "@/lib/seo-presets";
import { PresetToolBoard } from "@/components/PresetToolBoard";
import { ArrowRight, CheckCircle2, ShieldCheck, Info } from "lucide-react";

const LABELS_BY_LOCALE: Record<
  PresetLocale,
  {
    home: string;
    hub: string;
    relatedTitle: string;
    parentLabel: string;
    faqTitle: string;
  }
> = {
  id: {
    home: "Beranda",
    hub: "Preset & Panduan",
    relatedTitle: "Preset & Alat Terkait Lainnya",
    parentLabel: "Alat Utama:",
    faqTitle: "Pertanyaan yang Sering Diajukan",
  },
  en: {
    home: "Home",
    hub: "Presets & Guides",
    relatedTitle: "Related Size Presets & Tools",
    parentLabel: "Main Tool:",
    faqTitle: "Frequently Asked Questions",
  },
  ja: {
    home: "ホーム",
    hub: "プリセット一覧",
    relatedTitle: "関連プリセット・ツール",
    parentLabel: "基本ツール:",
    faqTitle: "よくある質問",
  },
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    SEO_PRESETS.map((preset) => ({ locale, slug: preset.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const preset = SEO_PRESETS_BY_SLUG[slug];
  if (!preset) return {};

  const loc = resolvePresetLocale(locale);
  const copy = preset.copy[loc];
  return buildPageMetadata({
    locale,
    path: `/presets/${preset.slug}`,
    title: copy.seoTitle,
    description: copy.seoDescription,
  });
}

export default async function PresetDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const preset = SEO_PRESETS_BY_SLUG[slug];
  if (!preset) {
    notFound();
  }

  const loc = resolvePresetLocale(locale);
  const copy = preset.copy[loc];
  const labels = LABELS_BY_LOCALE[loc];
  const related = preset.relatedSlugs
    .map((s) => SEO_PRESETS_BY_SLUG[s])
    .filter(Boolean);

  const pageUrl = absoluteUrl(locale, `/presets/${preset.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: labels.home,
            item: absoluteUrl(locale, ""),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: labels.hub,
            item: absoluteUrl(locale, "/presets"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.h1,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "HowTo",
        name: copy.stepsTitle,
        description: copy.seoDescription,
        step: copy.steps.map((st, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: st.title,
          text: st.desc,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb & Focused Hero Header */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 space-y-3">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[color:var(--ink)]/60">
          <Link href="/" className="hover:text-teal-600 transition">
            {labels.home}
          </Link>
          <span>/</span>
          <Link href="/presets" className="hover:text-teal-600 transition">
            {labels.hub}
          </Link>
          <span>/</span>
          <span className="text-[color:var(--ink)] font-medium truncate">{copy.h1}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {copy.badge}
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--ink)]">
          {copy.h1}
        </h1>
        <p className="text-sm sm:text-base text-[color:var(--ink)]/70 leading-relaxed max-w-2xl">
          {copy.lead}
        </p>
      </div>

      {/* Interactive Tool Workspace */}
      <div className="mt-2">
        <PresetToolBoard
          toolKind={preset.toolKind}
          title={copy.h1}
          description={copy.lead}
          targetKb={preset.targetKb}
          locale={loc}
        />
      </div>

      {/* Data-Driven Specifications, Steps, Tips & FAQs */}
      <section className="mx-auto mt-12 max-w-4xl px-4 sm:px-6 space-y-12">
        {/* Technical Specifications Table */}
        <div className="rounded-2xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-6 shadow-2xs">
          <h2 className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-[color:var(--ink)] mb-4">
            {copy.specsTitle}
          </h2>
          <div className="divide-y divide-[color:var(--ink)]/10">
            {copy.specs.map((row) => (
              <div
                key={row.label}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm"
              >
                <span className="font-medium text-[color:var(--ink)]/70">{row.label}</span>
                <span className="font-semibold text-[color:var(--ink)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-step */}
        <div className="space-y-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[color:var(--ink)]">
            {copy.stepsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {copy.steps.map((st, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-5 space-y-2"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-bold text-[color:var(--ink)]">{st.title}</h3>
                <p className="text-xs text-[color:var(--ink)]/70 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Tips */}
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-200">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <h2>{copy.tipsTitle}</h2>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-[color:var(--ink)]/80">
            {copy.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[color:var(--ink)]">
            {labels.faqTitle}
          </h2>
          <dl className="space-y-3">
            {copy.faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-5"
              >
                <dt className="text-sm font-semibold text-[color:var(--ink)]">{faq.q}</dt>
                <dd className="mt-1.5 text-xs sm:text-sm text-[color:var(--ink)]/75 leading-relaxed">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hub-and-Spoke Internal Links */}
        <div className="border-t border-[color:var(--ink)]/10 pt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[color:var(--ink)]">{labels.relatedTitle}</h2>
            <Link
              href={preset.parentToolPath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              <span>
                {labels.parentLabel} {preset.parentToolName[loc]}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((rel) => {
              const rc = rel.copy[loc];
              return (
                <Link
                  key={rel.slug}
                  href={`/presets/${rel.slug}`}
                  className="rounded-xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-4 hover:border-teal-500/50 transition flex flex-col justify-between gap-2"
                >
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                    {rc.badge}
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--ink)]">
                    {rc.h1}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

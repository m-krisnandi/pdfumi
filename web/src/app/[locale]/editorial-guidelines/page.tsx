import { getTranslations, setRequestLocale } from "next-intl/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";
import { Scale, CheckCircle2, AlertCircle, FileSearch, RefreshCw } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "editorial.seo" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: absoluteUrl(locale, "/editorial-guidelines"),
      languages: languageAlternates("/editorial-guidelines"),
    },
  };
}

export default async function EditorialGuidelinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "editorial" });

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <header className="border-b border-zinc-200 dark:border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 mb-4">
          <Scale className="h-3.5 w-3.5" />
          <span>E-E-A-T & Journalistic Standards</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{t("lastUpdated")}</p>
      </header>

      <div className="mt-8 space-y-8 text-zinc-700 dark:text-zinc-300">
        <section className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/40 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("s1Title")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s1Body")}</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/40 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("s2Title")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s2Body")}</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/40 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-2">
            <FileSearch className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("s3Title")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s3Body")}</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/40 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("s4Title")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s4Body")}</p>
        </section>
      </div>

      <div className="mt-10 border-t border-zinc-200 dark:border-white/10 pt-6 flex flex-wrap gap-4 text-xs font-semibold text-teal-600 dark:text-teal-400">
        <Link href="/privacy" className="hover:underline">Privacy Policy →</Link>
        <Link href="/terms" className="hover:underline">Terms of Service →</Link>
        <Link href="/contact" className="hover:underline">Contact Editorial Team →</Link>
      </div>
    </article>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";
import { ShieldCheck, Zap, Globe, Users, FileText } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.seo" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: absoluteUrl(locale, "/about"),
      languages: languageAlternates("/about"),
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <header className="border-b border-zinc-200 dark:border-white/10 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 mb-4">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified Publisher & Document Platform</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
          {t("subtitle")}
        </p>
      </header>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s1Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s1Body")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s2Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s2Body")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s3Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s3Body")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <Globe className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s4Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s4Body")}</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s5Title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s5Body")}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
              <Link href="/contact" className="text-teal-600 dark:text-teal-400 hover:underline">
                Contact Support →
              </Link>
              <Link href="/editorial-guidelines" className="text-zinc-600 dark:text-zinc-400 hover:underline">
                Editorial Guidelines →
              </Link>
              <a href="https://news.pdfumi.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 hover:underline">
                Visit Global News Portal ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

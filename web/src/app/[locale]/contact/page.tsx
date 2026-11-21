import { getTranslations, setRequestLocale } from "next-intl/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";
import { Mail, Clock, MessageSquare, Shield, HelpCircle } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.seo" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: absoluteUrl(locale, "/contact"),
      languages: languageAlternates("/contact"),
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <header className="border-b border-zinc-200 dark:border-white/10 pb-8 text-center sm:text-left">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
          {t("subtitle")}
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s1Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s1Body")}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="h-4 w-4 text-teal-600" />
            <span>SLA Response: Within 24 Hours</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s2Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s2Body")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s3Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s3Body")}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("s4Title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t("s4Body")}</p>
          <div className="mt-4">
            <Link href="/feedback" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              Open Feedback Form →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

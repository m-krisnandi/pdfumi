import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LoginConfirmBoard } from "@/components/LoginConfirmBoard";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: t("loginConfirmTitle") + " | Pdfumi",
    robots: { index: false, follow: false },
    alternates: {
      canonical: absoluteUrl(locale, "/account/login"),
      languages: languageAlternates("/account/login"),
    },
  };
}

export default async function AccountLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-16 text-sm text-[color:var(--ink)]/50">…</div>}>
      <LoginConfirmBoard />
    </Suspense>
  );
}

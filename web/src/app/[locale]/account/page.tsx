import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AccountBoard } from "@/components/AccountBoard";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/account";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    ...buildPageMetadata({
      locale,
      path: PATH,
      title: t("seo.title"),
      description: t("seo.description"),
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-16 text-sm text-[color:var(--ink)]/50">…</div>}>
      <AccountBoard />
    </Suspense>
  );
}

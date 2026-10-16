import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/i18n/seo";
import { HomeHeroWorkspace } from "@/components/HomeHeroWorkspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildPageMetadata({
    locale,
    path: "",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeHeroWorkspace />;
}

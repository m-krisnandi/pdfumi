import { getTranslations, setRequestLocale } from "next-intl/server";
import { GrayscalePdfBoard } from "@/components/GrayscalePdfBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/grayscale-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "grayscalePdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function GrayscalePdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <GrayscalePdfBoard />
      <ToolLandingSeo locale={locale} namespace="grayscalePdf" />
    </>
  );
}

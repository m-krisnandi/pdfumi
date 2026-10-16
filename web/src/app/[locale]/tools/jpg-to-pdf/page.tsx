import { getTranslations, setRequestLocale } from "next-intl/server";
import { JpgToPdfBoard } from "@/components/JpgToPdfBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/jpg-to-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jpgToPdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function JpgToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <JpgToPdfBoard />
      <ToolLandingSeo locale={locale} namespace="jpgToPdf" />
    </>
  );
}

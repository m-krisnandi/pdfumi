import { getTranslations, setRequestLocale } from "next-intl/server";
import { PdfToImageBoard } from "@/components/PdfToImageBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/pdf-to-png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pdfToPng" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function PdfToPngPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PdfToImageBoard format="png" />
      <ToolLandingSeo locale={locale} namespace="pdfToPng" />
    </>
  );
}

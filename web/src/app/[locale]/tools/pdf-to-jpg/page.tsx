import { getTranslations, setRequestLocale } from "next-intl/server";
import { PdfToImageBoard } from "@/components/PdfToImageBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/pdf-to-jpg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pdfToJpg" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function PdfToJpgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PdfToImageBoard format="jpg" />
      <ToolLandingSeo locale={locale} namespace="pdfToJpg" />
    </>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { PdfPagesOpsBoard } from "@/components/PdfPagesOpsBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/extract-pdf-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "extractPages" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function ExtractPdfPagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PdfPagesOpsBoard mode="extract" />
      <ToolLandingSeo locale={locale} namespace="extractPages" />
    </>
  );
}

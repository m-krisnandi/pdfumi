import { getTranslations, setRequestLocale } from "next-intl/server";
import { OfficeConvertBoard } from "@/components/OfficeConvertBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/pdf-to-word";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pdfToWord" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function PdfToWordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <OfficeConvertBoard mode="pdf-to-word" />
      <ToolLandingSeo locale={locale} namespace="pdfToWord" />
    </>
  );
}

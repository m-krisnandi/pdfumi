import { getTranslations, setRequestLocale } from "next-intl/server";
import { OfficeConvertBoard } from "@/components/OfficeConvertBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/excel-to-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "excelToPdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <OfficeConvertBoard mode="excel-to-pdf" />
      <ToolLandingSeo locale={locale} namespace="excelToPdf" />
    </>
  );
}

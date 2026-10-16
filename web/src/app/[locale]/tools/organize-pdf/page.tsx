import { getTranslations, setRequestLocale } from "next-intl/server";
import { PdfPagesOpsBoard } from "@/components/PdfPagesOpsBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/organize-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "organizePdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function OrganizePdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PdfPagesOpsBoard mode="organize" />
      <ToolLandingSeo locale={locale} namespace="organizePdf" />
    </>
  );
}

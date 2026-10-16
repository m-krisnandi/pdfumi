import { getTranslations, setRequestLocale } from "next-intl/server";
import { PdfPagesOpsBoard } from "@/components/PdfPagesOpsBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/rotate-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rotatePdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function RotatePdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PdfPagesOpsBoard mode="rotate" />
      <ToolLandingSeo locale={locale} namespace="rotatePdf" />
    </>
  );
}

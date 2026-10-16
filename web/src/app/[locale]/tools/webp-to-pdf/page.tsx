import { getTranslations, setRequestLocale } from "next-intl/server";
import { ImagesToPdfBoard } from "@/components/ImagesToPdfBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/webp-to-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "webpToPdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function WebpToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <ImagesToPdfBoard acceptedType="image/webp" titleKey="webpToPdf" />
      <ToolLandingSeo locale={locale} namespace="webpToPdf" />
    </>
  );
}

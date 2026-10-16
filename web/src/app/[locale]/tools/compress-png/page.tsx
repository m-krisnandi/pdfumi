import { getTranslations, setRequestLocale } from "next-intl/server";
import { CompressImageBoard } from "@/components/CompressImageBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/compress-png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compressPng" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function CompressPngPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <CompressImageBoard
        namespace="compressPng"
        forcedFormat="png"
        accept="image/png,.png"
      />
      <ToolLandingSeo locale={locale} namespace="compressPng" />
    </>
  );
}

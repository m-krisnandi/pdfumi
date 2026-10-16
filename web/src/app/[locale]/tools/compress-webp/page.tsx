import { getTranslations, setRequestLocale } from "next-intl/server";
import { CompressImageBoard } from "@/components/CompressImageBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/compress-webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compressWebp" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function CompressWebpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <CompressImageBoard
        namespace="compressWebp"
        forcedFormat="webp"
        accept="image/webp,.webp"
      />
      <ToolLandingSeo locale={locale} namespace="compressWebp" />
    </>
  );
}

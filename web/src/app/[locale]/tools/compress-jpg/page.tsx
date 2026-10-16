import { getTranslations, setRequestLocale } from "next-intl/server";
import { CompressImageBoard } from "@/components/CompressImageBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/compress-jpg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compressJpg" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function CompressJpgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <CompressImageBoard
        namespace="compressJpg"
        forcedFormat="jpeg"
        accept="image/jpeg,.jpg,.jpeg"
      />
      <ToolLandingSeo locale={locale} namespace="compressJpg" />
    </>
  );
}

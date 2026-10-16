import { getTranslations, setRequestLocale } from "next-intl/server";
import { RemoveMetadataPdfBoard } from "@/components/RemoveMetadataPdfBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/remove-metadata-pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "removeMetadataPdf" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function RemoveMetadataPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <RemoveMetadataPdfBoard />
      <ToolLandingSeo locale={locale} namespace="removeMetadataPdf" />
    </>
  );
}

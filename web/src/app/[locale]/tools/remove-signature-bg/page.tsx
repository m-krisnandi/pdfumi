import { getTranslations, setRequestLocale } from "next-intl/server";
import { RemoveSignatureBgBoard } from "@/components/RemoveSignatureBgBoard";
import { ToolLandingSeo } from "@/components/ToolLandingSeo";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/tools/remove-signature-bg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "removeSignatureBg" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function RemoveSignatureBgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <RemoveSignatureBgBoard />
      <ToolLandingSeo locale={locale} namespace="removeSignatureBg" />
    </>
  );
}

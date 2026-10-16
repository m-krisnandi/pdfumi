import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingBoard } from "@/components/PricingBoard";
import { buildPageMetadata, siteOrigin } from "@/i18n/seo";

const PATH = "/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return buildPageMetadata({
    locale,
    path: PATH,
    title: t("seo.title"),
    description: t("seo.description"),
  });
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pricing" });
  const origin = siteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pdfumi",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": `${origin}/${locale}/pricing`,
    "description": t("seo.description"),
    "offers": [
      {
        "@type": "Offer",
        "name": "Event Pass",
        "price": "19000",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        "name": "Pro Bulanan",
        "price": "29000",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        "name": "Tahunan / Bisnis",
        "price": "149000",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricingBoard />
    </>
  );
}

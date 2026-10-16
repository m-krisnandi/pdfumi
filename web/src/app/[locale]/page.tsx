import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, siteOrigin, absoluteUrl } from "@/i18n/seo";
import { HomeHeroWorkspace } from "@/components/HomeHeroWorkspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildPageMetadata({
    locale,
    path: "",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const origin = siteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        "url": origin,
        "name": "Pdfumi",
        "description": t("description"),
        "inLanguage": locale,
        "publisher": {
          "@id": `${origin}/#organization`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        "name": "Pdfumi",
        "url": origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${origin}/icon.svg`,
        },
        "sameAs": ["https://pdfumi.com"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#software`,
        "name": "Pdfumi",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "url": origin,
        "description": t("description"),
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "IDR",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${origin}/#sitelinks`,
        "name": "Pdfumi Key Tools",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": locale === "id" ? "Kompres PDF" : "Compress PDF",
            "url": absoluteUrl(locale, "/tools/compress-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": locale === "id" ? "PDF ke Word" : "PDF to Word",
            "url": absoluteUrl(locale, "/tools/pdf-to-word"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": locale === "id" ? "Gabungkan PDF" : "Merge PDF",
            "url": absoluteUrl(locale, "/tools/merge-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": locale === "id" ? "JPG ke PDF" : "JPG to PDF",
            "url": absoluteUrl(locale, "/tools/jpg-to-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": locale === "id" ? "Buat Kwitansi Online" : "Receipt Generator",
            "url": absoluteUrl(locale, "/tools/kwitansi"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": locale === "id" ? "Buat Sertifikat Massal" : "Bulk Certificate Generator",
            "url": absoluteUrl(locale, "/tools/sertifikat"),
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHeroWorkspace />
    </>
  );
}

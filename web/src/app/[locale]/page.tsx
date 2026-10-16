import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, siteOrigin, absoluteUrl } from "@/i18n/seo";
import { HomeHeroWorkspace } from "@/components/HomeHeroWorkspace";

function getSitelinkName(locale: string, toolKey: string): string {
  if (locale === "ja") {
    switch (toolKey) {
      case "compress":
        return "PDF圧縮 (容量削減・軽量化)";
      case "pdfToWord":
        return "PDF Word変換 (DOCX)";
      case "merge":
        return "PDF結合 (複数PDFを1つに)";
      case "jpgToPdf":
        return "JPGをPDFに変換";
      case "receipt":
        return "領収書作成ツール";
      case "certificate":
        return "修了証・賞状一括作成";
    }
  }
  if (locale === "my") {
    switch (toolKey) {
      case "compress":
        return "PDF ချုံ့ရန်";
      case "pdfToWord":
        return "PDF မှ Word သို့";
      case "merge":
        return "PDF ပေါင်းစည်းရန်";
      case "jpgToPdf":
        return "JPG မှ PDF သို့";
      case "receipt":
        return "ပြေစာဖန်တီးရန်";
      case "certificate":
        return "လက်မှတ်ဖန်တီးရန်";
    }
  }
  if (locale === "id") {
    switch (toolKey) {
      case "compress":
        return "Kompres PDF Online";
      case "pdfToWord":
        return "PDF ke Word (Bisa Diedit)";
      case "merge":
        return "Gabungkan PDF";
      case "jpgToPdf":
        return "JPG ke PDF";
      case "receipt":
        return "Buat Kwitansi Online";
      case "certificate":
        return "Buat Sertifikat Massal";
    }
  }
  switch (toolKey) {
    case "compress":
      return "Compress PDF Online";
    case "pdfToWord":
      return "PDF to Word Converter";
    case "merge":
      return "Merge PDF Files";
    case "jpgToPdf":
      return "JPG to PDF Converter";
    case "receipt":
      return "Receipt Generator";
    case "certificate":
      return "Certificate Generator";
    default:
      return toolKey;
  }
}

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
            "name": getSitelinkName(locale, "compress"),
            "url": absoluteUrl(locale, "/tools/compress-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": getSitelinkName(locale, "pdfToWord"),
            "url": absoluteUrl(locale, "/tools/pdf-to-word"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": getSitelinkName(locale, "merge"),
            "url": absoluteUrl(locale, "/tools/merge-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": getSitelinkName(locale, "jpgToPdf"),
            "url": absoluteUrl(locale, "/tools/jpg-to-pdf"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": getSitelinkName(locale, "receipt"),
            "url": absoluteUrl(locale, "/tools/kwitansi"),
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": getSitelinkName(locale, "certificate"),
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

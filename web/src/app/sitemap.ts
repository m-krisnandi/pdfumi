import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { absoluteUrl, siteOrigin } from "@/i18n/seo";

const paths = [
  "",
  "/pricing",
  "/account",
  "/terms",
  "/privacy",
  "/refund",
  "/tools/compress-image",
  "/tools/compress-jpg",
  "/tools/compress-pdf",
  "/tools/compress-png",
  "/tools/compress-webp",
  "/tools/crop-pdf",
  "/tools/delete-pdf-pages",
  "/tools/edit-pdf",
  "/tools/excel-to-pdf",
  "/tools/extract-pdf-pages",
  "/tools/fill-pdf",
  "/tools/flatten-pdf",
  "/tools/grayscale-pdf",
  "/tools/header-footer-pdf",
  "/tools/heic-to-pdf",
  "/tools/invoice",
  "/tools/jpg-to-pdf",
  "/tools/kontrak",
  "/tools/kwitansi",
  "/tools/merge-pdf",
  "/tools/organize-pdf",
  "/tools/page-numbers-pdf",
  "/tools/pas-foto",
  "/tools/pdf-converter",
  "/tools/pdf-to-excel",
  "/tools/pdf-to-jpg",
  "/tools/pdf-to-png",
  "/tools/pdf-to-word",
  "/tools/png-to-pdf",
  "/tools/protect-pdf",
  "/tools/redact-pdf",
  "/tools/remove-metadata-pdf",
  "/tools/remove-signature-bg",
  "/tools/resize-image",
  "/tools/resize-pdf",
  "/tools/rotate-pdf",
  "/tools/scan-pdf",
  "/tools/sertifikat",
  "/tools/sign-pdf",
  "/tools/split-pdf",
  "/tools/surat",
  "/tools/unlock-pdf",
  "/tools/watermark-pdf",
  "/tools/webp-to-pdf",
  "/tools/word-to-pdf",
];

/** Multilingual sitemap so Google can discover EN / JA / ID / MY URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, absoluteUrl(l, path)]),
            ["x-default", absoluteUrl("en", path)],
          ]),
        },
      });
    }
  }

  // Also list origin for crawlers that hit the apex
  entries.push({
    url: siteOrigin(),
    lastModified,
  });

  return entries;
}

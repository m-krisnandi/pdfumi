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
  "/tools/kwitansi",
  "/tools/merge-pdf",
  "/tools/watermark-pdf",
  "/tools/sertifikat",
  "/tools/jpg-to-pdf",
  "/tools/pdf-to-jpg",
  "/tools/pdf-to-png",
  "/tools/compress-pdf",
  "/tools/split-pdf",
  "/tools/rotate-pdf",
  "/tools/delete-pdf-pages",
  "/tools/extract-pdf-pages",
  "/tools/organize-pdf",
  "/tools/pdf-to-word",
  "/tools/word-to-pdf",
  "/tools/pdf-converter",
  "/tools/protect-pdf",
  "/tools/unlock-pdf",
  "/tools/sign-pdf",
  "/tools/page-numbers-pdf",
  "/tools/crop-pdf",
  "/tools/pdf-to-excel",
  "/tools/excel-to-pdf",
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

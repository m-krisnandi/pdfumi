import { indexableLocales, locales, type Locale } from "./config";
import type { Metadata } from "next";

/** Public site origin for canonical + hreflang (SEO). */
export function siteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_WEB_BASE ||
    "https://pdfumi.com";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(locale: string, path = ""): string {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${siteOrigin()}/${locale}${normalized}`;
}

/** hreflang map for Google (x-default → English). */
export function languageAlternates(path = ""): Record<string, string> {
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  const languages: Record<string, string> = {
    "x-default": absoluteUrl("en", normalized),
  };
  for (const locale of indexableLocales) {
    languages[locale] = absoluteUrl(locale, normalized);
  }
  return languages;
}

export function localeHtmlLang(locale: string): string {
  if (locale === "ja") return "ja";
  if (locale === "id") return "id";
  if (locale === "my") return "my";
  return "en";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function ogLocale(locale: string): string {
  if (locale === "ja") return "ja_JP";
  if (locale === "id") return "id_ID";
  if (locale === "my") return "my_MM";
  return "en_US";
}

/** Shared metadata builder for tool / marketing pages. */
export function buildPageMetadata(opts: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const { locale, path, title, description } = opts;
  const url = absoluteUrl(locale, path);
  const og = ogLocale(locale);
  return {
    title,
    description,
    robots: {
      index: (indexableLocales as readonly string[]).includes(locale),
      follow: true,
    },
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Pdfumi",
      type: "website",
      locale: og,
      alternateLocale: ["en_US", "ja_JP", "id_ID", "my_MM"].filter((code) => code !== og),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

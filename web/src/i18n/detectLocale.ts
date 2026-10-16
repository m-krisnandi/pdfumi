import { defaultLocale, locales, type Locale } from "./config";

/** Country codes → app locale (ISO 3166-1 alpha-2). */
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  ID: "id",
  JP: "ja",
  MM: "my",
};

/**
 * Map Accept-Language tags to our locales.
 * Only id / ja / my are "strong" matches; anything else falls through to geo or English.
 */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const parts = header.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.find((p) => p.trim().startsWith("q="));
    const quality = q ? Number(q.split("=")[1]) || 0 : 1;
    return { tag: tag.trim().toLowerCase(), quality };
  });
  parts.sort((a, b) => b.quality - a.quality);

  for (const { tag } of parts) {
    if (tag === "*" || !tag) continue;
    const primary = tag.split("-")[0];
    if (primary === "id") return "id";
    if (primary === "ja") return "ja";
    if (primary === "my") return "my";
    // Explicit English preference → English (don't override with geo)
    if (primary === "en") return "en";
  }
  return null;
}

export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return COUNTRY_TO_LOCALE[country.trim().toUpperCase()] ?? null;
}

/** Read common CDN / platform geo headers. */
export function countryFromHeaders(getHeader: (name: string) => string | null): string | null {
  return (
    getHeader("x-vercel-ip-country") ||
    getHeader("cf-ipcountry") ||
    getHeader("cloudfront-viewer-country") ||
    getHeader("x-country-code") ||
    null
  );
}

/**
 * Resolve locale for first visit (no cookie / no locale prefix yet).
 * Priority: Accept-Language (id/ja/my/en) → geo (ID/JP/MM) → English.
 */
export function detectPreferredLocale(input: {
  acceptLanguage: string | null;
  country: string | null;
}): Locale {
  const fromLang = localeFromAcceptLanguage(input.acceptLanguage);
  if (fromLang) return fromLang;
  const fromGeo = localeFromCountry(input.country);
  if (fromGeo) return fromGeo;
  return defaultLocale;
}

export function isAppLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const locales = ["en", "ja", "id", "my"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/**
 * Only publish locales with complete, human-reviewed SEO copy.
 * Myanmar remains available in the UI, but its current mixed-language copy
 * should not be indexed as duplicate/low-quality content until translation is
 * completed.
 */
export const indexableLocales = ["en", "ja", "id"] as const satisfies readonly Locale[];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  id: "Indonesia",
  my: "မြန်မာ",
};

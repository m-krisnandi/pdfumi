import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { defaultLocale, locales, type Locale } from "./i18n/config";
import {
  countryFromHeaders,
  detectPreferredLocale,
  isAppLocale,
} from "./i18n/detectLocale";

const handleI18n = createMiddleware(routing);

const LOCALE_COOKIE = "NEXT_LOCALE";

function hasLocalePrefix(pathname: string): boolean {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/**
 * Locale strategy (ID / JP / MM / rest of world):
 * 1. Existing NEXT_LOCALE cookie or /{locale}/… URL → respect it
 * 2. First hit on `/` → Accept-Language (id/ja/my/en), else geo country, else English
 * 3. Language switcher updates cookie so preference sticks
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  // These products were intentionally removed. Return 410 instead of
  // redirecting to an unrelated image compressor, so crawlers drop stale URLs
  // and users are not sent to a misleading replacement.
  if (/^\/(?:en|ja|id|my)\/tools\/compress-(?:audio|video)$/.test(pathname) || /^\/tools\/compress-(?:audio|video)$/.test(pathname)) {
    return new NextResponse("Gone", {
      status: 410,
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  // Bare `/` without a saved preference: pick locale before next-intl defaults to English-only.
  if (pathname === "/" && !isAppLocale(cookieLocale)) {
    const preferred = detectPreferredLocale({
      acceptLanguage: request.headers.get("accept-language"),
      country: countryFromHeaders((name) => request.headers.get(name)),
    });

    if (preferred !== defaultLocale || !hasLocalePrefix(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${preferred}`;
      const response = NextResponse.redirect(url);
      setLocaleCookie(response, preferred);
      return response;
    }
  }

  const response = handleI18n(request);

  // Persist explicit /{locale}/ navigation into the cookie for next visits.
  if (hasLocalePrefix(pathname)) {
    const segment = pathname.split("/")[1];
    if (isAppLocale(segment) && cookieLocale !== segment) {
      setLocaleCookie(response, segment);
    }
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

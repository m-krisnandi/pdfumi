import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { locales } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeScript } from "@/components/ThemeScript";
import { ToolsMegaMenu } from "@/components/ToolsMegaMenu";
import { CreateDropdown } from "@/components/CreateDropdown";
import { AccountNav } from "@/components/AccountNav";
import "@/app/globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function bodyFontClass(locale: string) {
  if (locale === "ja") return "font-jp";
  if (locale === "my") return "font-my";
  return "font-body";
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "nav" });
  const tFooter = await getTranslations({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className="antialiased"
      >
        <NextIntlClientProvider messages={messages}>
          <div className={`min-h-screen ${bodyFontClass(locale)} flex flex-col justify-between`}>
            <div>
              {/* Harmonized Topbar Container */}
              <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-zinc-200/50 dark:border-white/5">
                {/* Left: Brand Logo & Navigation */}
                <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
                  <Link href="/" className="text-xl sm:text-2xl tracking-tight shrink-0 hover:opacity-85 transition">
                    <span className="font-[family-name:var(--font-display)] font-extrabold text-zinc-900 dark:text-white">
                      PDF
                    </span>
                    <span className="font-[family-name:var(--font-display)] font-extrabold text-teal-600 dark:text-teal-400">
                      umi
                    </span>
                  </Link>

                  {/* Mega Menu Toggle */}
                  <ToolsMegaMenu />

                  {/* Quick-Access Tools */}
                  <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    <Link
                      href="/tools/compress-pdf"
                      className="rounded-xl px-2.5 py-1.5 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10 transition"
                    >
                      Compress
                    </Link>
                    <Link
                      href="/tools/merge-pdf"
                      className="rounded-xl px-2.5 py-1.5 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10 transition"
                    >
                      {t("merge")}
                    </Link>
                    <Link
                      href="/tools/pdf-to-word"
                      className="rounded-xl px-2.5 py-1.5 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10 transition"
                    >
                      PDF to Word
                    </Link>

                    {/* Create ▾ Dropdown */}
                    <CreateDropdown />
                  </nav>
                </div>

                {/* Right: Pricing, Auth, Theme, Language */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/pricing"
                    className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1 transition"
                  >
                    {t("pricing")}
                  </Link>

                  <AccountNav />

                  <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-200 dark:border-white/10 pl-2">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>
                </div>
              </header>

              <main>{children}</main>
            </div>

            {/* Harmonized Footer Container with SEO Directory */}
            <footer className="mt-20 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-950/70 backdrop-blur-md pt-12 pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
                {/* Categorized Footer Tool Links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Compress
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/compress-pdf" className="hover:text-teal-600 transition">Compress PDF</Link></li>
                      <li><Link href="/tools/compress-image" className="hover:text-teal-600 transition">Compress Image</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Convert
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/pdf-converter" className="hover:text-teal-600 transition">PDF Converter</Link></li>
                      <li><Link href="/tools/jpg-to-pdf" className="hover:text-teal-600 transition">JPG to PDF</Link></li>
                      <li><Link href="/tools/pdf-to-word" className="hover:text-teal-600 transition">PDF to Word</Link></li>
                      <li><Link href="/tools/word-to-pdf" className="hover:text-teal-600 transition">Word to PDF</Link></li>
                      <li><Link href="/tools/excel-to-pdf" className="hover:text-teal-600 transition">Excel to PDF</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Organize
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/merge-pdf" className="hover:text-teal-600 transition">Merge PDF</Link></li>
                      <li><Link href="/tools/split-pdf" className="hover:text-teal-600 transition">Split PDF</Link></li>
                      <li><Link href="/tools/rotate-pdf" className="hover:text-teal-600 transition">Rotate PDF</Link></li>
                      <li><Link href="/tools/delete-pdf-pages" className="hover:text-teal-600 transition">Delete Pages</Link></li>
                      <li><Link href="/tools/crop-pdf" className="hover:text-teal-600 transition">Crop PDF</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Edit & Sign
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/edit-pdf" className="hover:text-teal-600 transition">Edit PDF</Link></li>
                      <li><Link href="/tools/sign-pdf" className="hover:text-teal-600 transition">Sign PDF</Link></li>
                      <li><Link href="/tools/redact-pdf" className="hover:text-teal-600 transition">Redact PDF</Link></li>
                      <li><Link href="/tools/watermark-pdf" className="hover:text-teal-600 transition">Watermark PDF</Link></li>
                      <li><Link href="/tools/flatten-pdf" className="hover:text-teal-600 transition">Flatten PDF</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Create Documents
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/kwitansi" className="hover:text-teal-600 transition">Receipt / Kwitansi</Link></li>
                      <li><Link href="/tools/invoice" className="hover:text-teal-600 transition">Invoice Generator</Link></li>
                      <li><Link href="/tools/sertifikat" className="hover:text-teal-600 transition">Certificates</Link></li>
                      <li><Link href="/tools/surat" className="hover:text-teal-600 transition">Official Letters</Link></li>
                      <li><Link href="/tools/kontrak" className="hover:text-teal-600 transition">Contracts & Agreements</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 text-[11px]">
                      Image & Scanner
                    </p>
                    <ul className="space-y-1.5">
                      <li><Link href="/tools/pas-foto" className="hover:text-teal-600 transition">Passport / Pas Foto</Link></li>
                      <li><Link href="/tools/resize-image" className="hover:text-teal-600 transition">Resize Image</Link></li>
                      <li><Link href="/tools/remove-signature-bg" className="hover:text-teal-600 transition">Remove Signature BG</Link></li>
                      <li><Link href="/tools/scan-pdf" className="hover:text-teal-600 transition">Mobile Camera Scan</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-zinc-200/80 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                  <p>© {new Date().getFullYear()} {tFooter("footer")}. All rights reserved.</p>
                  <div className="flex flex-wrap items-center gap-5">
                    <Link href="/pricing" className="hover:text-teal-600 transition">
                      {t("pricing")}
                    </Link>
                    <Link href="/terms" className="hover:text-teal-600 transition">
                      {t("terms")}
                    </Link>
                    <Link href="/privacy" className="hover:text-teal-600 transition">
                      {t("privacy")}
                    </Link>
                    <Link href="/refund" className="hover:text-teal-600 transition">
                      {t("refund")}
                    </Link>
                    <Link href="/feedback" className="hover:text-teal-600 transition font-medium text-teal-600 dark:text-teal-400">
                      Feedback & Report Bug
                    </Link>
                    <a
                      href="mailto:support@pdfumi.com"
                      className="hover:text-teal-600 transition"
                    >
                      {t("contact")}: support@pdfumi.com
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

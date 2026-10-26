import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { siteOrigin } from "@/i18n/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: "Pdfumi",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: false,
  },
};

/** Required root shell; html/body live in [locale]/layout for lang + fonts. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

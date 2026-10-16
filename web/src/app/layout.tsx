import type { ReactNode } from "react";
import "./globals.css";

/** Required root shell; html/body live in [locale]/layout for lang + fonts. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
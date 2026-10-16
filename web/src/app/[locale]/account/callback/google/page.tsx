import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { GoogleCallbackBoard } from "@/components/GoogleCallbackBoard";

export const metadata: Metadata = {
  title: "Masuk dengan Google | Pdfumi",
  robots: { index: false, follow: false },
};

export default async function GoogleCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-16 text-sm text-zinc-500">Memproses Google OAuth…</div>}>
      <GoogleCallbackBoard />
    </Suspense>
  );
}

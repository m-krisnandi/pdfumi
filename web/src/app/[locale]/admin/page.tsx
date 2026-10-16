import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AdminPricingBoard } from "@/components/AdminPricingBoard";

export async function generateMetadata() {
  return {
    title: "Admin Portal | Pdfumi",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-16 text-sm text-[color:var(--ink)]/50">Memuat portal admin...</div>}>
      <AdminPricingBoard />
    </Suspense>
  );
}

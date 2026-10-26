import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeedbackBoard } from "@/components/FeedbackBoard";
import { buildPageMetadata } from "@/i18n/seo";

const PATH = "/feedback";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let title = "Feedback & Laporkan Masalah — Pdfumi";
  let description = "Kirim masukan, usulan fitur, atau laporkan kendala teknis langsung kepada tim pengembang Pdfumi.";

  try {
    const t = await getTranslations({ locale, namespace: "feedback.seo" });
    title = t("title");
    description = t("description");
  } catch {
    // fallback if translation namespace not loaded
  }

  return {
    ...buildPageMetadata({
      locale,
      path: PATH,
      title,
      description,
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen py-6">
      <FeedbackBoard />
    </div>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { absoluteUrl, languageAlternates } from "@/i18n/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "refund.seo" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: absoluteUrl(locale, "/refund"),
      languages: languageAlternates("/refund"),
    },
  };
}

export default async function RefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "refund" });

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-[color:var(--line)] pb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">{t("lastUpdated")}</p>
      </header>
      <div className="prose mt-8 space-y-8 text-[color:var(--ink)]/85">
        <section>
          <h2 className="text-xl font-semibold text-[color:var(--ink)]">{t("s1Title")}</h2>
          <p className="mt-2 leading-relaxed">{t("s1Body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[color:var(--ink)]">{t("s2Title")}</h2>
          <p className="mt-2 leading-relaxed">{t("s2Body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[color:var(--ink)]">{t("s3Title")}</h2>
          <p className="mt-2 leading-relaxed">{t("s3Body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[color:var(--ink)]">{t("s4Title")}</h2>
          <p className="mt-2 leading-relaxed">{t("s4Body")}</p>
        </section>
      </div>
    </article>
  );
}

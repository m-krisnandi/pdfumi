import { getTranslations } from "next-intl/server";

type FaqItem = { q: string; a: string };

/**
 * Below-the-tool SEO block: visible FAQ + FAQPage JSON-LD for crawlers.
 */
export async function ToolLandingSeo({
  locale,
  namespace,
}: {
  locale: string;
  namespace: string;
}) {
  const t = await getTranslations({ locale, namespace });
  let faqs: FaqItem[] = [];
  try {
    const raw = t.raw("seo.faqs");
    if (Array.isArray(raw)) {
      faqs = raw.filter(
        (item): item is FaqItem =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as FaqItem).q === "string" &&
          typeof (item as FaqItem).a === "string",
      );
    }
  } catch {
    faqs = [];
  }

  if (faqs.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section className="mx-auto mt-12 max-w-2xl px-6 pb-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
        {t("seo.faqTitle")}
      </h2>
      <dl className="mt-6 space-y-5">
        {faqs.map((item) => (
          <div key={item.q}>
            <dt className="text-sm font-medium text-[color:var(--ink)]">{item.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-[color:var(--ink)]/70">{item.a}</dd>
          </div>
        ))}
      </dl>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

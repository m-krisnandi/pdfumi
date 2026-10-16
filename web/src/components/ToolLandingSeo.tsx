import { getTranslations } from "next-intl/server";
import {
  UploadCloud,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  CheckCircle2,
  Globe,
} from "lucide-react";

type FaqItem = { q: string; a: string };

/**
 * Below-the-tool SEO & Content block:
 * 1. Step-by-Step How-To guide + Schema.org HowTo
 * 2. Trust, Privacy & Guarantee badges
 * 3. FAQ section + Schema.org FAQPage
 */
export async function ToolLandingSeo({
  locale,
  namespace,
}: {
  locale: string;
  namespace: string;
}) {
  const t = await getTranslations({ locale, namespace });
  const isId = locale === "id";

  let toolTitle = "";
  try {
    toolTitle = t("title");
  } catch {
    try {
      toolTitle = t("seo.title");
    } catch {
      toolTitle = "Alat PDF Online";
    }
  }

  let toolDesc = "";
  try {
    toolDesc = t("description");
  } catch {
    try {
      toolDesc = t("seo.description");
    } catch {
      toolDesc = "";
    }
  }

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

  let faqTitle = isId ? "Pertanyaan yang Sering Diajukan" : "Frequently Asked Questions";
  try {
    const customFaqTitle = t("seo.faqTitle");
    if (customFaqTitle) faqTitle = customFaqTitle;
  } catch {
    // fallback
  }

  const steps = [
    {
      step: 1,
      icon: UploadCloud,
      title: isId ? "1. Unggah Dokumen" : "1. Upload Document",
      desc: isId
        ? "Pilih file dari perangkat Anda atau seret langsung berkas ke kotak unggah di atas."
        : "Select files from your device or drag and drop your document into the upload area above.",
    },
    {
      step: 2,
      icon: SlidersHorizontal,
      title: isId ? "2. Proses & Sesuaikan" : "2. Process & Customize",
      desc: isId
        ? "Sesuaikan pengaturan atau parameter yang Anda inginkan. Sistem memproses secara otomatis dan instan."
        : "Adjust options to your preference. The system processes and optimizes your document instantly.",
    },
    {
      step: 3,
      icon: Download,
      title: isId ? "3. Unduh Siap Pakai" : "3. Instant Download",
      desc: isId
        ? "Simpan file hasil yang bersih tanpa watermark dan siap untuk kebutuhan formal atau bisnis Anda."
        : "Save your clean output file with zero watermarks, ready for any personal or official use.",
    },
  ];

  const trustBadges = [
    {
      icon: ShieldCheck,
      title: isId ? "Enkripsi Aman 256-bit" : "256-bit SSL Security",
      desc: isId
        ? "Proses transfer file dilindungi protokol SSL/HTTPS terenkripsi. Berkas dihapus otomatis dalam 1 jam."
        : "End-to-end SSL/HTTPS encrypted processing. Your files are automatically deleted within 1 hour.",
    },
    {
      icon: CheckCircle2,
      title: isId ? "100% Tanpa Watermark" : "Zero Watermarks",
      desc: isId
        ? "Hasil unduhan tidak disisipi watermark atau logo tambahan. Format dan ketajaman teks tetap terjaga."
        : "Clean documents with no added watermarks. Preserves sharp typography and original layout.",
    },
    {
      icon: Globe,
      title: isId ? "Akses Lintas Perangkat" : "Cross-Platform Access",
      desc: isId
        ? "Bekerja langsung di browser Windows, macOS, Android, dan iPhone tanpa perlu menginstal aplikasi."
        : "Works smoothly on macOS, Windows, iOS, and Android without downloading any third-party app.",
    },
  ];

  // Schema.org Graph
  const graphEntities: any[] = [
    {
      "@type": "HowTo",
      name: isId ? `Cara Menggunakan: ${toolTitle}` : `How to Use: ${toolTitle}`,
      description: toolDesc || toolTitle,
      step: steps.map((s) => ({
        "@type": "HowToStep",
        position: s.step,
        name: s.title,
        text: s.desc,
      })),
    },
  ];

  if (faqs.length > 0) {
    graphEntities.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graphEntities,
  };

  return (
    <section className="mx-auto mt-16 max-w-4xl px-6 pb-16 space-y-16">
      {/* 1. How To Use Section */}
      <div>
        <div className="text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold tracking-wider uppercase text-[color:var(--ink)]/50">
            {isId ? "Panduan Praktis" : "Quick Guide"}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[color:var(--ink)]">
            {isId ? `Cara Menggunakan: ${toolTitle}` : `How to Use: ${toolTitle}`}
          </h2>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-2xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-6 shadow-xs flex flex-col"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--ink)]/5 text-[color:var(--ink)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[color:var(--ink)]">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[color:var(--ink)]/70">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Trust & Security Badges */}
      <div className="rounded-2xl border border-[color:var(--ink)]/10 bg-[color:var(--ink)]/[0.02] p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div key={idx} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ink)]/10 text-[color:var(--ink)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[color:var(--ink)]">
                    {badge.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink)]/70">
                    {badge.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FAQ Section */}
      {faqs.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[color:var(--ink)]">
              {faqTitle}
            </h2>
          </div>
          <dl className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-5"
              >
                <dt className="text-sm font-medium text-[color:var(--ink)]">
                  {item.q}
                </dt>
                <dd className="mt-2 text-xs leading-relaxed text-[color:var(--ink)]/75">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* JSON-LD Rich Snippet Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

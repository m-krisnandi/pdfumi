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

type LocaleContent = {
  quickGuide: string;
  howToTitle: (title: string) => string;
  steps: { title: string; desc: string }[];
  trustBadges: { title: string; desc: string }[];
  faqTitleFallback: string;
};

const CONTENT_BY_LOCALE: Record<string, LocaleContent> = {
  ja: {
    quickGuide: "利用ガイド",
    howToTitle: (title) => `${title} の使い方`,
    steps: [
      {
        title: "1. ファイルをアップロード",
        desc: "端末からファイルを選択するか、上の作業エリアに直接ドラッグ＆ドロップします。",
      },
      {
        title: "2. 自動処理＆調整",
        desc: "お好みの設定を選択すると、システムが瞬時にファイルを最適化・処理します。",
      },
      {
        title: "3. すぐにダウンロード",
        desc: "透かし（ウォーターマーク）なしの綺麗なファイルをそのままダウンロードできます。",
      },
    ],
    trustBadges: [
      {
        title: "256ビット暗号化セキュリティ",
        desc: "SSL/HTTPSによる完全暗号化通信。ファイルは処理後1時間で自動削除されます。",
      },
      {
        title: "透かしなし 100%保証",
        desc: "完成ファイルに余計なロゴやウォーターマークは一切付与されません。",
      },
      {
        title: "ブラウザ完結・全端末対応",
        desc: "Mac、Windows、iPhone、Androidのブラウザでアプリ不要でそのまま使えます。",
      },
    ],
    faqTitleFallback: "よくある質問",
  },
  my: {
    quickGuide: "အသုံးပြုနည်း လမ်းညွှန်",
    howToTitle: (title) => `${title} အသုံးပြုပုံ`,
    steps: [
      {
        title: "၁။ ဖိုင်တင်ပါ",
        desc: "သင့်စက်မှ ဖိုင်ကို ရွေးချယ်ပါ သို့မဟုတ် ဤနေရာသို့ ဆွဲထည့်ပါ။",
      },
      {
        title: "၂။ အလိုအလျောက် ဆောင်ရွက်ခြင်း",
        desc: "လိုအပ်သော ဆက်တင်များကို ရွေးချယ်ပြီး စနစ်က ချက်ချင်း လုပ်ဆောင်ပေးပါမည်။",
      },
      {
        title: "၃။ ချက်ချင်း ဒေါင်းလုဒ်ရယူပါ",
        desc: "ဝါတာမတ်မပါသော သန့်ရှင်းသောဖိုင်ကို စက္ကန့်ပိုင်းအတွင်း ဒေါင်းလုဒ်လုပ်ပါ။",
      },
    ],
    trustBadges: [
      {
        title: "၂၅၆-ဘစ် လုံခြုံရေး အကာအကွယ်",
        desc: "SSL/HTTPS ဖြင့် ကာကွယ်ထားပြီး ဖိုင်များကို ၁ နာရီအတွင်း အပြီးအပိုင် ဖျက်ပစ်ပါသည်။",
      },
      {
        title: "ဝါတာမတ် လုံးဝမပါပါ",
        desc: "ဒေါင်းလုဒ်လုပ်သော ဖိုင်များတွင် ဝါတာမတ် သို့မဟုတ် လိုဂို မပါဝင်ပါ။",
      },
      {
        title: "မည်သည့်စက်ပစ္စည်းမဆို သုံးနိုင်သည်",
        desc: "ဆော့ဖ်ဝဲလ် ထည့်သွင်းရန်မလိုဘဲ ဖုန်းနှင့် ကွန်ပျူတာ ဘရောက်ဇာတွင် တိုက်ရိုက် သုံးနိုင်ပါသည်။",
      },
    ],
    faqTitleFallback: "မကြာခဏ မေးလေ့ရှိသော မေးခွန်းများ",
  },
  id: {
    quickGuide: "Panduan Praktis",
    howToTitle: (title) => `Cara Menggunakan: ${title}`,
    steps: [
      {
        title: "1. Unggah Dokumen",
        desc: "Pilih file dari perangkat Anda atau seret langsung berkas ke kotak unggah di atas.",
      },
      {
        title: "2. Proses & Sesuaikan",
        desc: "Sesuaikan pengaturan atau parameter yang Anda inginkan. Sistem memproses secara otomatis dan instan.",
      },
      {
        title: "3. Unduh Siap Pakai",
        desc: "Simpan file hasil yang bersih tanpa watermark dan siap untuk kebutuhan formal atau bisnis Anda.",
      },
    ],
    trustBadges: [
      {
        title: "Enkripsi Aman 256-bit",
        desc: "Proses transfer file dilindungi protokol SSL/HTTPS terenkripsi. Berkas dihapus otomatis dalam 1 jam.",
      },
      {
        title: "100% Tanpa Watermark",
        desc: "Hasil unduhan tidak disisipi watermark atau logo tambahan. Format dan ketajaman teks tetap terjaga.",
      },
      {
        title: "Akses Lintas Perangkat",
        desc: "Bekerja langsung di browser Windows, macOS, Android, dan iPhone tanpa perlu menginstal aplikasi.",
      },
    ],
    faqTitleFallback: "Pertanyaan yang Sering Diajukan",
  },
  en: {
    quickGuide: "Quick Guide",
    howToTitle: (title) => `How to Use: ${title}`,
    steps: [
      {
        title: "1. Upload Document",
        desc: "Select files from your device or drag and drop your document into the upload area above.",
      },
      {
        title: "2. Process & Customize",
        desc: "Adjust options to your preference. The system processes and optimizes your document instantly.",
      },
      {
        title: "3. Instant Download",
        desc: "Save your clean output file with zero watermarks, ready for any personal or official use.",
      },
    ],
    trustBadges: [
      {
        title: "256-bit SSL Security",
        desc: "End-to-end SSL/HTTPS encrypted processing. Your files are automatically deleted within 1 hour.",
      },
      {
        title: "Zero Watermarks",
        desc: "Clean documents with no added watermarks. Preserves sharp typography and original layout.",
      },
      {
        title: "Cross-Platform Access",
        desc: "Works smoothly on macOS, Windows, iOS, and Android without downloading any third-party app.",
      },
    ],
    faqTitleFallback: "Frequently Asked Questions",
  },
};

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
  const content = CONTENT_BY_LOCALE[locale] ?? CONTENT_BY_LOCALE.en;

  let toolTitle = "";
  try {
    toolTitle = t("title");
  } catch {
    try {
      toolTitle = t("seo.title");
    } catch {
      toolTitle = "Pdfumi Tool";
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

  let faqTitle = content.faqTitleFallback;
  try {
    const customFaqTitle = t("seo.faqTitle");
    if (customFaqTitle) faqTitle = customFaqTitle;
  } catch {
    // fallback
  }

  const stepIcons = [UploadCloud, SlidersHorizontal, Download];
  const trustIcons = [ShieldCheck, CheckCircle2, Globe];

  // Schema.org Graph
  const graphEntities: any[] = [
    {
      "@type": "HowTo",
      name: content.howToTitle(toolTitle),
      description: toolDesc || toolTitle,
      step: content.steps.map((s, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
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
            {content.quickGuide}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[color:var(--ink)]">
            {content.howToTitle(toolTitle)}
          </h2>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.steps.map((s, idx) => {
            const Icon = stepIcons[idx] ?? UploadCloud;
            return (
              <div
                key={idx}
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
          {content.trustBadges.map((badge, idx) => {
            const Icon = trustIcons[idx] ?? ShieldCheck;
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

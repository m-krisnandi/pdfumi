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
        title: "安全なファイル処理",
        desc: "ブラウザ内で完結するツール、または暗号化通信で処理するサーバーツールを提供しています。",
      },
      {
        title: "透かしなし",
        desc: "完成ファイルにPdfumiのロゴや余計なウォーターマークを追加しません。",
      },
      {
        title: "主要デバイス対応",
        desc: "Mac、Windows、iPhone、Androidの主要ブラウザから利用できます。",
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
        title: "လုံခြုံသော ဖိုင်လုပ်ဆောင်မှု",
        desc: "ဘရောက်ဇာအတွင်း တိုက်ရိုက်လုပ်ဆောင်သော tool များ သို့မဟုတ် encryption ဖြင့် server ပေါ်တွင် လုပ်ဆောင်သော tool များကို ပေးထားပါသည်။",
      },
      {
        title: "ဝါတာမတ် မပါပါ",
        desc: "ပြီးဆုံးသောဖိုင်တွင် Pdfumi logo သို့မဟုတ် မလိုအပ်သော ဝါတာမတ် ထည့်မပေးပါ။",
      },
      {
        title: "အဓိကစက်များကို ပံ့ပိုးသည်",
        desc: "Mac၊ Windows၊ iPhone နှင့် Android ရှိ အဓိကဘရောက်ဇာများမှ အသုံးပြုနိုင်ပါသည်။",
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
        title: "Pemrosesan File yang Aman",
        desc: "Tool yang tersedia diproses langsung di browser atau melalui koneksi terenkripsi pada tool yang menggunakan server.",
      },
      {
        title: "Tanpa Watermark",
        desc: "File hasil tidak diberi logo Pdfumi atau watermark tambahan yang tidak diperlukan.",
      },
      {
        title: "Mendukung Perangkat Utama",
        desc: "Gunakan dari browser utama di Windows, macOS, Android, dan iPhone.",
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
        title: "Secure File Processing",
        desc: "Tools process files in the browser where possible, or use encrypted connections when server processing is required.",
      },
      {
        title: "No Watermarks",
        desc: "Output files do not include a Pdfumi logo or unnecessary added watermark.",
      },
      {
        title: "Works on Major Devices",
        desc: "Use Pdfumi from modern browsers on macOS, Windows, iOS, and Android.",
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

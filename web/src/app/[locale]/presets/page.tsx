import { setRequestLocale } from "next-intl/server";
import { buildPageMetadata, absoluteUrl } from "@/i18n/seo";
import { Link } from "@/i18n/navigation";
import { SEO_PRESETS, resolvePresetLocale, PresetLocale } from "@/lib/seo-presets";
import { ArrowRight, FileCheck2, Image as ImageIcon, FileStack, Sparkles } from "lucide-react";

const HUB_COPY: Record<
  PresetLocale,
  {
    seoTitle: string;
    seoDescription: string;
    eyebrow: string;
    h1: string;
    lead: string;
    groups: { key: "pdf-size" | "photo-id" | "image-size" | "workflow"; title: string; desc: string }[];
    openTool: string;
  }
> = {
  id: {
    seoTitle: "Preset Ukuran PDF, Pas Foto & Panduan Dokumen Resmi | Pdfumi",
    seoDescription:
      "Kumpulan alat preset khusus syarat portal: kompres PDF dibawah 100KB/200KB/500KB/1MB, pas foto 3x4/4x6/visa, gabung lamaran kerja, & tanda tangan PNG.",
    eyebrow: "Preset & Panduan Dokumen",
    h1: "Preset Ukuran & Alur Dokumen Siap Upload",
    lead: "Halaman alat khusus yang sudah disesuaikan dengan batas ukuran portal SSCASN/CPNS, lamaran kerja, SKCK, paspor, dan media sosial.",
    groups: [
      {
        key: "pdf-size",
        title: "Target Ukuran PDF (KB / MB)",
        desc: "Kompres dokumen dengan verifikasi otomatis batas 100 KB, 200 KB, 500 KB, hingga 1 MB.",
      },
      {
        key: "photo-id",
        title: "Standar Pas Foto Resmi (300 DPI)",
        desc: "Potong ukuran pas foto presisi dan ganti latar belakang merah, biru, atau putih di browser.",
      },
      {
        key: "image-size",
        title: "Target Ukuran Gambar & Media Sosial",
        desc: "Kompres JPG otomatis di bawah 100/200 KB serta resize preset YouTube, TikTok, dan Instagram.",
      },
      {
        key: "workflow",
        title: "Alur Berkas Lamaran & Tanda Tangan",
        desc: "Gabungkan berkas lamaran kerja berurutan atau buat tanda tangan PNG transparan untuk Word & PDF.",
      },
    ],
    openTool: "Buka Alat",
  },
  en: {
    seoTitle: "PDF Size Presets, ID Photo Sizes & Document Guides | Pdfumi",
    seoDescription:
      "Targeted PDF & photo presets: compress PDF under 100KB/200KB/500KB/1MB, shrink JPG below 200KB, create 3x4/4x6/2x2 ID photos, and transparent signatures.",
    eyebrow: "Presets & Workflow Guides",
    h1: "Ready-to-Upload PDF & Photo Presets",
    lead: "Pre-configured browser and cloud tools calibrated for strict government portals, visa forms, job applications, and creator dimensions.",
    groups: [
      {
        key: "pdf-size",
        title: "PDF Target File Sizes",
        desc: "Optimize PDFs with instant verification against 100 KB, 200 KB, 500 KB, and 1 MB upload limits.",
      },
      {
        key: "photo-id",
        title: "Official ID & Visa Photos",
        desc: "Exact 300 DPI pixel presets with local background replacement for passports, visas, and IDs.",
      },
      {
        key: "image-size",
        title: "Target-KB & Social Image Resizers",
        desc: "Client-side binary-search JPG compression under 100/200 KB plus creator aspect ratios.",
      },
      {
        key: "workflow",
        title: "Application & Signature Workflows",
        desc: "Bundle CVs and diplomas cleanly or extract transparent pen signatures for Word & PDFs.",
      },
    ],
    openTool: "Open Preset",
  },
  ja: {
    seoTitle: "PDF容量指定・証明写真規格・書類作成プリセット一覧 | Pdfumi",
    seoDescription:
      "100KB/200KB/500KB/1MB以下のPDF圧縮、200KB以下の画像圧縮、3×4/4×6/ビザ証明写真、応募書類結合や透過サイン作成の専用プリセット一覧。",
    eyebrow: "用途別プリセット・ガイド",
    h1: "提出規格に合わせたPDF・画像プリセット",
    lead: "Web応募フォームの容量制限や証明写真の規定サイズにそのまま合わせられる実用ツール一覧です。",
    groups: [
      {
        key: "pdf-size",
        title: "目標容量別 PDF圧縮",
        desc: "100KB・200KB・500KB・1MB以下の制限に収まったかを自動判定します。",
      },
      {
        key: "photo-id",
        title: "公式規格 証明写真・ビザ写真",
        desc: "300DPIの正確なピクセルサイズと背景色変更に対応した証明写真メーカー。",
      },
      {
        key: "image-size",
        title: "容量指定画像圧縮・SNSリサイズ",
        desc: "ブラウザ内で100KB/200KB以下に自動調整する画像圧縮とSNS用サイズ変換。",
      },
      {
        key: "workflow",
        title: "応募書類結合・透過サイン",
        desc: "履歴書・職務経歴書の一括結合や、Word・PDFに貼れる背景透過サイン作成。",
      },
    ],
    openTool: "ツールを開く",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = resolvePresetLocale(locale);
  const copy = HUB_COPY[loc];
  return buildPageMetadata({
    locale,
    path: "/presets",
    title: copy.seoTitle,
    description: copy.seoDescription,
  });
}

const GROUP_ICONS = {
  "pdf-size": FileCheck2,
  "photo-id": Sparkles,
  "image-size": ImageIcon,
  workflow: FileStack,
};

export default async function PresetsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = resolvePresetLocale(locale);
  const copy = HUB_COPY[loc];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.h1,
    description: copy.seoDescription,
    url: absoluteUrl(locale, "/presets"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
          {copy.eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--ink)]">
          {copy.h1}
        </h1>
        <p className="text-sm sm:text-base text-[color:var(--ink)]/70 leading-relaxed">
          {copy.lead}
        </p>
      </header>

      <div className="space-y-10">
        {copy.groups.map((group) => {
          const items = SEO_PRESETS.filter((p) => p.category === group.key);
          const Icon = GROUP_ICONS[group.key];
          return (
            <section key={group.key} className="space-y-4">
              <div className="flex items-start gap-3 border-b border-[color:var(--ink)]/10 pb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[color:var(--ink)]">{group.title}</h2>
                  <p className="text-xs text-[color:var(--ink)]/65">{group.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((preset) => {
                  const c = preset.copy[loc];
                  return (
                    <Link
                      key={preset.slug}
                      href={`/presets/${preset.slug}`}
                      className="group rounded-2xl border border-[color:var(--ink)]/10 bg-[color:var(--paper)] p-5 shadow-2xs hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <span className="inline-block rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                          {c.badge}
                        </span>
                        <h3 className="text-sm font-bold text-[color:var(--ink)] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                          {c.h1}
                        </h3>
                        <p className="text-xs text-[color:var(--ink)]/65 leading-relaxed line-clamp-2">
                          {c.lead}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {copy.openTool}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

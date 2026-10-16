"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Search,
  Minimize2,
  Combine,
  FileText,
  PenLine,
  PenTool,
  Image,
  Scissors,
  ImageDown,
  ReceiptText,
  Receipt,
  Award,
  ScrollText,
  FileCheck,
  ShieldCheck,
  Zap,
  Lock,
  Check,
  Sparkles,
  ChevronDown,
  UserCheck,
} from "lucide-react";

type ToolCard = {
  href: string;
  title: string;
  desc: string;
  badge?: string;
  tone: string;
  icon: typeof Minimize2;
  keywords: string[];
};

export function HomeHeroWorkspace() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isId = locale === "id";

  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 8 High-intent popular tools
  const popularTools: ToolCard[] = useMemo(() => {
    return [
      {
        href: "/tools/compress-pdf",
        title: isId ? "Kompres PDF" : "Compress PDF",
        desc: isId
          ? "Kecilkan ukuran file PDF ke target < 200 KB, 500 KB, atau 1 MB tanpa buram."
          : "Reduce PDF file size to exact target < 200 KB, 500 KB, or 1 MB.",
        badge: isId ? "Target < 200 KB" : "Exact Target KB",
        tone: "bg-[#e85d4c] text-white",
        icon: Minimize2,
        keywords: ["compress", "kompres", "kecilkan", "size", "200kb", "cpns", "bumn", "sscasn"],
      },
      {
        href: "/tools/merge-pdf",
        title: isId ? "Gabung PDF" : "Merge PDF",
        desc: isId
          ? "Satukan beberapa file dokumen PDF menjadi satu berkas rapi."
          : "Combine multiple PDF documents into one single file.",
        tone: "bg-[#7b5ea7] text-white",
        icon: Combine,
        keywords: ["merge", "gabung", "satukan", "combine", "join"],
      },
      {
        href: "/tools/pdf-to-word",
        title: "PDF to Word",
        desc: isId
          ? "Konversi PDF ke dokumen DOCX Word yang bisa diedit kembali."
          : "Convert PDF documents to editable Microsoft Word (.docx) files.",
        tone: "bg-[#3b6fd9] text-white",
        icon: FileText,
        keywords: ["word", "docx", "doc", "edit", "convert", "konversi"],
      },
      {
        href: "/tools/edit-pdf",
        title: isId ? "Edit PDF" : "Edit PDF",
        desc: isId
          ? "Tambah teks, sorot kalimat stabilo, dan tempel bentuk langsung di browser."
          : "Add text, highlight sentences, and insert shapes directly in your browser.",
        tone: "bg-[#2a9d8f] text-white",
        icon: PenLine,
        keywords: ["edit", "teks", "highlight", "sorot", "stabilo", "anotasi"],
      },
      {
        href: "/tools/sign-pdf",
        title: isId ? "Tanda Tangan PDF" : "Sign PDF",
        desc: isId
          ? "Bubuhi tanda tangan digital dan minta tanda tangan dari rekan kerja."
          : "Sign documents electronically and send signature requests to colleagues.",
        tone: "bg-[#2a9d8f] text-white",
        icon: PenTool,
        keywords: ["sign", "ttd", "tanda tangan", "signature", "paraf", "materai"],
      },
      {
        href: "/tools/jpg-to-pdf",
        title: "JPG to PDF",
        desc: isId
          ? "Ubah foto kamera atau gambar JPG menjadi satu dokumen PDF siap cetak."
          : "Convert JPG photos or image scans into clean PDF documents.",
        tone: "bg-[#e8a838] text-white",
        icon: Image,
        keywords: ["jpg", "jpeg", "foto", "gambar", "image", "foto ke pdf"],
      },
      {
        href: "/tools/split-pdf",
        title: isId ? "Pisah PDF" : "Split PDF",
        desc: isId
          ? "Ekstrak atau pisahkan halaman tertentu dari file PDF Anda."
          : "Extract specific pages or split document into separate PDFs.",
        tone: "bg-[#7b5ea7] text-white",
        icon: Scissors,
        keywords: ["split", "pisah", "potong", "ekstrak", "extract", "halaman"],
      },
      {
        href: isId ? "/tools/pas-foto" : "/tools/compress-image",
        title: isId ? "Pas Foto (2x3, 3x4, 4x6)" : "Compress Image",
        desc: isId
          ? "Buat pas foto CPNS, BUMN, dan SKCK dengan ganti latar merah atau biru."
          : "Compress JPG, PNG, WebP, GIF, HEIC images to exact target KB sizes.",
        badge: isId ? "Merah & Biru CPNS" : "Target KB",
        tone: isId ? "bg-[#e07a3a] text-white" : "bg-[#e85d4c] text-white",
        icon: isId ? UserCheck : ImageDown,
        keywords: ["foto", "pas foto", "cpns", "ijazah", "compress image", "kompres gambar", "jpg", "png", "webp", "gif", "heic"],
      },
    ];
  }, [isId]);

  // Extended tools for rich search discovery
  const additionalSearchTools: ToolCard[] = useMemo(() => {
    return [
      {
        href: "/tools/compress-image",
        title: isId ? "Kompres Gambar" : "Compress Image",
        desc: isId
          ? "Kompres semua format gambar JPG, PNG, WebP, GIF, HEIC ke target KB tertentu tanpa buram."
          : "Compress JPG, PNG, WebP, GIF, HEIC images to exact target KB sizes.",
        badge: "Target KB",
        tone: "bg-[#e85d4c] text-white",
        icon: ImageDown,
        keywords: ["foto", "gambar", "image", "jpg", "png", "webp", "gif", "heic", "compress image", "kompres gambar"],
      },

    ];
  }, [isId]);

  // Unique Differentiator: Document Generator Suite
  const documentTemplates = useMemo(() => {
    return [
      {
        href: "/tools/kwitansi",
        title: isId ? "Kwitansi Pembayaran" : "Payment Receipt",
        desc: isId
          ? "Format kwitansi tanda terima resmi lengkap dengan terbilang otomatis dan TTD."
          : "Professional payment receipts with auto spelled-out numbers and signatures.",
        badge: "Paling Populer",
        tone: "bg-[#2f9e6b] text-white",
        icon: ReceiptText,
      },
      {
        href: "/tools/invoice",
        title: isId ? "Invoice Tagihan" : "Commercial Invoice",
        desc: isId
          ? "Buat tagihan resmi dengan rincian barang/jasa, pajak, diskon, dan nomor rekening."
          : "Itemized billing invoices with taxes, discounts, and payment details.",
        badge: "Bisnis & Freelance",
        tone: "bg-[#2a9d8f] text-white",
        icon: Receipt,
      },
      {
        href: "/tools/sertifikat",
        title: isId ? "Sertifikat Penghargaan" : "Certificates",
        desc: isId
          ? "Buat sertifikat kelulusan, webinar, atau penghargaan dengan bingkai elegan."
          : "Certificate maker for webinars, completions, and honors.",
        badge: "Batch & Single",
        tone: "bg-[#e8a838] text-white",
        icon: Award,
      },
      {
        href: "/tools/surat",
        title: isId ? "Surat Resmi & Dinas" : "Official Letter",
        desc: isId
          ? "Format surat dinas dan instansi dengan kop surat bergaris dan penomoran baku."
          : "Standard formal letters with organizational letterhead and reference numbers.",
        badge: "Standar Administrasi",
        tone: "bg-[#3b6fd9] text-white",
        icon: ScrollText,
      },
      {
        href: "/tools/kontrak",
        title: isId ? "Kontrak & Perjanjian SPK" : "Contracts & Agreements",
        desc: isId
          ? "Surat perjanjian kerja sama, MoU, dan kontrak kerja dengan pasal-pasal dinamis."
          : "Employment contracts, MoUs, and NDAs with customizable legal clauses.",
        badge: "Dua Pihak",
        tone: "bg-[#7b5ea7] text-white",
        icon: FileCheck,
      },
    ];
  }, [isId]);

  // Filtered tools when searching (searches across all popular + additional tools)
  const filteredTools = useMemo(() => {
    if (!query.trim()) return popularTools;
    const q = query.toLowerCase();
    const allTools = [...popularTools, ...additionalSearchTools];
    const seen = new Set<string>();
    const unique = allTools.filter((t) => {
      if (seen.has(t.href)) return false;
      seen.add(t.href);
      return true;
    });

    return unique.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query, popularTools, additionalSearchTools]);

  const faqs = [
    {
      q: isId ? "Apakah dokumen saya aman dan privat?" : "Are my documents safe and private?",
      a: isId
        ? "Sangat aman. Pemrosesan PDF dan gambar seperti kompresi, penggabungan, dan penandatanganan dijalankan langsung di peramban (client-side) tanpa menyimpan berkas Anda di penyimpanan server pihak ketiga."
        : "Yes, 100%. Most PDF and image processing (merging, editing, signatures, and compression) runs client-side directly in your browser. We never retain or sell your confidential documents.",
    },
    {
      q: isId ? "Bagaimana cara kompres PDF di bawah 200 KB untuk CPNS/BUMN?" : "How does exact target compression work?",
      a: isId
        ? "Cukup pilih menu Kompres PDF, lalu klik preset 'Di Bawah 200 KB'. Algoritma cerdas kami secara otomatis menyesuaikan resolusi grafis dan kedalaman warna sehingga berkas lolos validasi SSCASN tanpa buram."
        : "Select the Compress PDF or Compress Image tool and click the '< 200 KB' preset or enter your custom KB number. Our adaptive downsampler dynamically balances resolution to guarantee fitting your size limit.",
    },
    {
      q: isId ? "Apakah Pdfumi gratis digunakan?" : "Is Pdfumi free to use?",
      a: isId
        ? "Ya! Seluruh perkakas standar dapat digunakan secara gratis setiap hari. Untuk pengguna dengan volume berkas besar tanpa batas harian, tersedia paket Event Pass dan Unlimited Pro."
        : "Yes! All standard PDF and document tools are free for daily use. For high-volume power users, we offer flexible Event Passes and Unlimited Pro subscriptions.",
    },
    {
      q: isId ? "Perlukah menginstal software atau ekstensi?" : "Do I need to install any software or plugins?",
      a: isId
        ? "Tidak perlu sama sekali. Pdfumi berjalan 100% di web browser modern pada perangkat Mac, Windows, iPhone, dan Android tanpa unduhan tambahan."
        : "No software or plugins required. Pdfumi runs seamlessly in any modern web browser on Mac, Windows, iOS, and Android.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-20">
      {/* 1. Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
          {isId ? (
            <>
              Semua Alat PDF yang Anda Butuhkan.{" "}
              <span className="text-teal-600 dark:text-teal-400">Cepat & Privat.</span>
            </>
          ) : (
            <>
              Every PDF tool you need.{" "}
              <span className="text-teal-600 dark:text-teal-400">Fast, private, no install.</span>
            </>
          )}
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          {isId
            ? "Kompres ke ukuran target, gabung, tanda tangani, dan buat dokumen resmi (invoice, kwitansi, surat) langsung di peramban Anda."
            : "Compress to exact KB sizes, merge, edit, e-sign, and generate official documents (invoices, receipts, contracts) in seconds."}
        </p>

        {/* Real-time Tool Search Bar */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-teal-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isId ? "Cari 40+ alat PDF (misal: kompres 200kb, gabung, ttd, word, scan)..." : "Search 40+ PDF tools (e.g. compress 200kb, merge, sign, word, scan)..."}
              className="w-full pl-12 pr-4 py-4 rounded-2xl glass-panel border border-zinc-200/80 dark:border-white/10 shadow-lg text-sm sm:text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white/70 dark:bg-zinc-900/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Popular High-Intent Tools Grid (8 Cards) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isId ? "Alat Paling Sering Digunakan" : "Most Popular Tools"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isId ? "Pilihan cepat untuk produktivitas dokumen harian Anda" : "Quick access to essential everyday PDF workflows"}
            </p>
          </div>
          <Link
            href="/tools/compress-pdf"
            className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {isId ? "Lihat Semua Alat →" : "Explore All Tools →"}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative rounded-3xl glass-panel p-5 border border-zinc-200/70 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-teal-500/50 hover:bg-white/90 dark:hover:bg-zinc-800/90 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-110 ${tool.tone}`}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    {tool.badge && (
                      <span className="rounded-full bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400 opacity-80 group-hover:opacity-100">
                  <span>{isId ? "Gunakan Alat" : "Start Now"}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Unique Differentiator: Document Generator Suite */}
      <section className="rounded-3xl bg-linear-to-b from-teal-500/5 to-transparent p-6 sm:p-8 border border-teal-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isId ? "Pembeda Utama Pdfumi" : "Built-in Document Generators"}</span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isId ? "Buat Dokumen Resmi Siap Cetak & TTD" : "Create Official PDF Documents Instantly"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              {isId
                ? "Bukan sekadar pengolah PDF biasa—Pdfumi dilengkapi generator dokumen profesional dengan kalkulasi otomatis, kop surat dinas, dan pasal perjanjian."
                : "Generate clean vector invoices, payment receipts, certificates, letters, and contracts directly into PDF without word processors."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {documentTemplates.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl glass-panel p-4 border border-zinc-200/80 dark:border-white/10 hover:border-teal-500 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${item.tone}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <span>Buat Sekarang</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Free vs Pro Snapshot */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isId ? "Transparan: Gratis vs Pro" : "Free vs Pro at a Glance"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isId
              ? "Gunakan gratis setiap hari, atau tingkatkan untuk kecepatan tanpa batas"
              : "Use free every day, or upgrade for unlimited power and priority speed"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Card */}
          <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-zinc-200/80 dark:border-white/10 space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Starter</span>
              <h3 className="font-bold text-xl text-zinc-900 dark:text-white mt-0.5">Free Plan</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {isId ? "Cocok untuk kebutuhan tugas & dokumen harian sesekali" : "Great for occasional document needs and light tasks"}
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Akses ke seluruh 40+ perkakas PDF & gambar" : "Access to all 40+ PDF & image tools"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Kompresi target < 200 KB & generator dokumen" : "Target compression & document templates"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Maksimal ukuran file 20 MB per berkas" : "Max 20 MB file size limit per upload"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Kuota standar harian gratis" : "Standard daily free task quota"}</span>
              </li>
            </ul>
            <div className="pt-2">
              <span className="block text-center text-xs font-bold text-zinc-500 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-white/10">
                {isId ? "Gratis Selamanya Tanpa Kartu Kredit" : "Free Forever, No Credit Card"}
              </span>
            </div>
          </div>

          {/* Pro Card */}
          <div className="rounded-3xl glass-panel p-6 sm:p-7 border-2 border-teal-500 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-teal-500 text-white text-[10px] font-extrabold px-3 py-1 shadow-sm uppercase tracking-wider">
                Recommended
              </span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Power User</span>
              <h3 className="font-bold text-xl text-zinc-900 dark:text-white mt-0.5">Unlimited Pro & Event Pass</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {isId ? "Untuk deadline mendesak, kantor, dan kebutuhan skala besar" : "For urgent deadlines, business workflows, and heavy files"}
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>{isId ? "Ukuran file hingga 100 MB per berkas" : "Up to 100 MB file size limit"}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Tanpa batasan kuota & antrean prioritas instan" : "Unlimited quota & zero queue priority engine"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Pilihan fleksibel: Event Pass 7 Hari (Rp19rb) atau Langganan Bulanan" : "Flexible: 7-Day Event Pass ($1.99) or Monthly Pro"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{isId ? "Mendukung pembayaran QRIS & Kartu Kredit Global" : "Supports QRIS, E-Wallets & Global Credit Cards"}</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/pricing"
                className="block text-center text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 py-3 rounded-xl shadow-md transition-all hover:scale-102 cursor-pointer"
              >
                {isId ? "Lihat Pilihan Paket Mulai Rp19.000 / $1.99 →" : "View Plans from $1.99 / Rp19,000 →"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trust Points */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="rounded-2xl glass-panel p-6 border border-zinc-200/80 dark:border-white/10 space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            {isId ? "Privat di Peramban Anda" : "Client-Side Privacy First"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isId
              ? "Sebagian besar pemrosesan berjalan langsung di browser Anda menggunakan WebAssembly dan pdf-lib tanpa melewati server pihak ketiga."
              : "Most processing runs directly in your browser with zero document tracking or persistent cloud retention."}
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-6 border border-zinc-200/80 dark:border-white/10 space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            {isId ? "Tanpa Instalasi Software" : "Zero Software Installation"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isId
              ? "Buka tautan dan gunakan langsung di perangkat apa pun: macOS, Windows, iPhone, Android, dan Linux tanpa aplikasi tambahan."
              : "Accessible instantly on any browser across desktop and mobile devices without installing heavy software."}
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-6 border border-zinc-200/80 dark:border-white/10 space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            {isId ? "Transmisi Terenkripsi SSL" : "Encrypted SSL Transmission"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {isId
              ? "Untuk perkakas konversi server seperti Office, seluruh lalu lintas data diamankan enkripsi HTTPS 256-bit dan file langsung dihapus."
              : "Any server-side conversions use 256-bit HTTPS TLS encryption with immediate automatic file deletion."}
          </p>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="max-w-3xl mx-auto space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isId ? "Pertanyaan yang Sering Diajukan" : "Frequently Asked Questions"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {isId ? "Informasi penting seputar keamanan, privasi, dan fitur Pdfumi" : "Everything you need to know about Pdfumi's security and features"}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl glass-panel border border-zinc-200/80 dark:border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-zinc-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

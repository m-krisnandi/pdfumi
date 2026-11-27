export type PresetLocale = "en" | "id" | "ja";

export type PresetToolKind =
  | "compress-pdf-target"
  | "compress-image-target"
  | "pas-foto"
  | "resize-image"
  | "merge-pdf"
  | "remove-signature-bg";

export type PresetLocaleCopy = {
  seoTitle: string;
  seoDescription: string;
  badge: string;
  h1: string;
  lead: string;
  specsTitle: string;
  specs: { label: string; value: string }[];
  stepsTitle: string;
  steps: { title: string; desc: string }[];
  tipsTitle: string;
  tips: string[];
  faqs: { q: string; a: string }[];
};

export type SeoPreset = {
  slug: string;
  category: "pdf-size" | "photo-id" | "image-size" | "workflow";
  toolKind: PresetToolKind;
  targetKb?: number;
  parentToolPath: string;
  parentToolName: Record<PresetLocale, string>;
  relatedSlugs: string[];
  copy: Record<PresetLocale, PresetLocaleCopy>;
};

export function resolvePresetLocale(locale: string): PresetLocale {
  if (locale === "id" || locale === "ja") return locale;
  return "en";
}

export const SEO_PRESETS: SeoPreset[] = [
  {
    slug: "compress-pdf-200kb",
    category: "pdf-size",
    toolKind: "compress-pdf-target",
    targetKb: 200,
    parentToolPath: "/tools/compress-pdf",
    parentToolName: {
      en: "Compress PDF",
      id: "Kompres PDF",
      ja: "PDF圧縮",
    },
    relatedSlugs: ["compress-pdf-100kb", "compress-pdf-500kb", "compress-jpg-200kb"],
    copy: {
      en: {
        seoTitle: "Compress PDF Under 200 KB Online Free | Pdfumi",
        seoDescription:
          "Shrink PDF documents under 200 KB for strict government, scholarship, and HR portals without losing text legibility or adding watermarks.",
        badge: "Target Limit: <= 200 KB",
        h1: "Compress PDF Under 200 KB",
        lead: "Designed for government applications, civil service uploads, and strict web forms that reject any PDF above 200 KB.",
        specsTitle: "200 KB Portal Upload Checklist",
        specs: [
          { label: "Maximum File Size", value: "200 KB (204,800 bytes)" },
          { label: "Recommended Source", value: "1–3 page scan or text PDF" },
          { label: "Text Readability", value: "Preserved vector fonts & crisp monochrome" },
          { label: "Privacy & Watermark", value: "Encrypted transfer, zero watermark" },
        ],
        stepsTitle: "How to Reach Under 200 KB",
        steps: [
          {
            title: "Upload your PDF",
            desc: "Drop your ID scan, form, or certificate into the compressor above.",
          },
          {
            title: "Verify target size",
            desc: "Pdfumi checks whether the output meets the 200 KB limit right after processing.",
          },
          {
            title: "If a scan stays above 200 KB",
            desc: "Convert heavy scanned pages to JPG, compress images to <= 200 KB, then merge back to PDF.",
          },
        ],
        tipsTitle: "Tips for Heavy Scanned PDFs",
        tips: [
          "Avoid 600 DPI full-color scanner presets; 150 DPI grayscale keeps stamps and signatures readable under 200 KB.",
          "Remove blank trailing pages with Split or Delete PDF Pages before compressing.",
        ],
        faqs: [
          {
            q: "Why do official portals enforce a 200 KB PDF limit?",
            a: "Government and civil service portals receive millions of simultaneous uploads and enforce strict 200 KB caps on identity cards and supporting certificates.",
          },
          {
            q: "What if my multi-page scanned PDF is still over 200 KB?",
            a: "If high-resolution camera scans exceed 200 KB after lossless PDF optimization, use PDF to JPG followed by our 200 KB image compressor and JPG to PDF.",
          },
          {
            q: "Does Pdfumi add a watermark to the compressed file?",
            a: "No. Compressed PDFs are clean and free of watermarks, ready for official verification.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres PDF Di Bawah 200 KB Online (CPNS & SSCASN) | Pdfumi",
        seoDescription:
          "Kecilkan ukuran file PDF di bawah 200 KB untuk syarat upload CPNS, SSCASN, PPPK, beasiswa, dan portal lamaran kerja tanpa watermark.",
        badge: "Target Maksimal: 200 KB",
        h1: "Kompres PDF Di Bawah 200 KB",
        lead: "Khusus untuk portal SSCASN BKN, pendaftaran CPNS/PPPK, dan formulir instansi yang menolak file PDF di atas 200 KB.",
        specsTitle: "Standar Upload Dokumen <= 200 KB",
        specs: [
          { label: "Batas Ukuran Portal", value: "Maksimal 200 KB (SSCASN / KYC / Bank)" },
          { label: "Jenis Dokumen Umum", value: "KTP, KK, Akta, Kartu Ujian, Scan 1–2 Halaman" },
          { label: "Resolusi Scan Ideal", value: "150 DPI Grayscale / Warna Terkompres" },
          { label: "Keamanan & Watermark", value: "Enkripsi HTTPS, bebas watermark" },
        ],
        stepsTitle: "Cara Kompres PDF Sampai Di Bawah 200 KB",
        steps: [
          {
            title: "Unggah berkas PDF",
            desc: "Pilih hasil scan KTP, surat pernyataan, atau dokumen syarat pendaftaran Anda.",
          },
          {
            title: "Cek indikator target 200 KB",
            desc: "Setelah kompresi selesai, sistem otomatis memeriksa apakah ukuran akhir sudah <= 200 KB.",
          },
          {
            title: "Opsi cadangan untuk scan kamera HP",
            desc: "Jika scan foto kamera masih > 200 KB, ubah ke JPG -> kompres target 200 KB -> gabung lagi jadi PDF.",
          },
        ],
        tipsTitle: "Agar Teks & Materai Tetap Terbaca Jelas",
        tips: [
          "Pastikan dokumen tidak mengandung halaman kosong tambahan sebelum dikompres.",
          "Foto dokumen dari HP umumnya berukuran 3–6 MB karena resolusi 12 MP; turunkan dimensi gambar ke lebar 1240 px untuk hasil tajam di bawah 200 KB.",
        ],
        faqs: [
          {
            q: "Apakah dokumen SSCASN / CPNS aman dikompres di Pdfumi?",
            a: "Ya. Seluruh transfer menggunakan enkripsi HTTPS dan berkas di server otomatis terhapus setelah selesai diproses.",
          },
          {
            q: "Kenapa hasil kompresi file scan kamera masih di atas 200 KB?",
            a: "Kamera HP menyimpan gambar beresolusi sangat besar di dalam PDF. Gunakan jalur PDF ke JPG lalu Kompres JPG <= 200 KB agar ukuran turun drastis namun tulisan tetap terbaca.",
          },
          {
            q: "Apakah ada watermark di file hasil kompres?",
            a: "Tidak ada watermark sama sekali sehingga langsung lolos verifikasi administrasi.",
          },
        ],
      },
      ja: {
        seoTitle: "PDFを200KB以下に圧縮するオンラインツール | Pdfumi",
        seoDescription:
          "行政手続き、採用エントリー、資格申請などの厳しい200KB容量制限に合わせてPDFを素早く軽量化。透かしなしで安全に処理します。",
        badge: "目標サイズ: 200 KB 以下",
        h1: "PDFを200KB以下に圧縮",
        lead: "官公庁や企業のWeb応募フォームで求められる「200KB以内」の提出制限に対応する専用プリセットです。",
        specsTitle: "200KB制限フォームの推奨仕様",
        specs: [
          { label: "最大ファイルサイズ", value: "200 KB（204,800 バイト）" },
          { label: "適した書類", value: "履歴書・証明書・本人確認書類（1〜3ページ）" },
          { label: "文字の視認性", value: "フォント情報を保持して鮮明に出力" },
          { label: "安全性・透かし", value: "暗号化通信・透かし一切なし" },
        ],
        stepsTitle: "200KB以下にする手順",
        steps: [
          {
            title: "PDFをアップロード",
            desc: "上のエリアに書類をドラッグ＆ドロップします。",
          },
          {
            title: "サイズ判定を確認",
            desc: "圧縮後のファイルが200KB以下に収まったか自動で判定表示します。",
          },
          {
            title: "スキャン画像が大きい場合",
            desc: "PDFをJPG化してから200KB画像圧縮を通し、再度PDFにまとめると確実に収まります。",
          },
        ],
        tipsTitle: "文字つぶれを防ぐコツ",
        tips: [
          "スキャナー設定は600dpiではなく150dpi前後で取り込むと、文字を保ったまま200KB以下に収まりやすくなります。",
          "不要な白紙ページがある場合は先にページ削除を行うと効果的です。",
        ],
        faqs: [
          {
            q: "履歴書や職務経歴書をアップロードしても安全ですか？",
            a: "はい。通信は暗号化され、処理後のファイルは自動削除されます。",
          },
          {
            q: "高画質スキャンPDFが200KB以下に下がらない場合は？",
            a: "画像解像度を下げるため、一度JPGへ変換してから200KB画像圧縮を実行し、JPGからPDFへ戻す方法をおすすめします。",
          },
          {
            q: "圧縮後のPDFにPdfumiのロゴは入りますか？",
            a: "入りません。そのまま公的機関や企業へ提出できます。",
          },
        ],
      },
    },
  },
  {
    slug: "compress-pdf-100kb",
    category: "pdf-size",
    toolKind: "compress-pdf-target",
    targetKb: 100,
    parentToolPath: "/tools/compress-pdf",
    parentToolName: {
      en: "Compress PDF",
      id: "Kompres PDF",
      ja: "PDF圧縮",
    },
    relatedSlugs: ["compress-pdf-200kb", "compress-jpg-100kb", "compress-pdf-500kb"],
    copy: {
      en: {
        seoTitle: "Compress PDF Under 100 KB Online Free | Pdfumi",
        seoDescription:
          "Reduce PDF files below 100 KB for strict KYC, visa portals, and legacy upload forms while keeping text clear and free of watermarks.",
        badge: "Target Limit: <= 100 KB",
        h1: "Compress PDF Under 100 KB",
        lead: "Built for ultra-strict 100 KB portals such as banking KYC, university admissions, and e-procurement systems.",
        specsTitle: "100 KB Strict Upload Profile",
        specs: [
          { label: "Target Ceiling", value: "100 KB (102,400 bytes)" },
          { label: "Best Document Length", value: "1 page text or compressed monochrome scan" },
          { label: "Recommended Color", value: "Black & white / grayscale for scans" },
          { label: "Output Integrity", value: "Standard PDF 1.4+, no watermark" },
        ],
        stepsTitle: "How to Fit Under 100 KB",
        steps: [
          {
            title: "Drop your PDF",
            desc: "Upload the single-page document or form you need to shrink.",
          },
          {
            title: "Check 100 KB status",
            desc: "Verify the final byte count against the 100 KB requirement.",
          },
          {
            title: "Extra shrinking for scans",
            desc: "Use PDF to JPG + 100 KB Image Compressor if raw camera photos bloat the PDF.",
          },
        ],
        tipsTitle: "How to Get Best Results at 100 KB",
        tips: [
          "Crop wide desk backgrounds from scanned documents before converting to PDF.",
          "Word/Google Docs exported directly as PDF compress far smaller than printed-then-photographed pages.",
        ],
        faqs: [
          {
            q: "Can every PDF be compressed below 100 KB?",
            a: "Native digital PDFs (Word/Excel exports) usually drop below 100 KB easily. Multi-page camera scans require image downsampling first.",
          },
          {
            q: "Will barcodes and QR codes remain scannable under 100 KB?",
            a: "Yes, digital vector PDFs keep QR codes razor sharp even below 50 KB.",
          },
          {
            q: "Is there any daily limit or signup requirement?",
            a: "No account is needed to start compressing documents right away.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres PDF Di Bawah 100 KB Online Gratis | Pdfumi",
        seoDescription:
          "Perkecil ukuran PDF hingga di bawah 100 KB untuk upload syarat verifikasi bank, kampus, dan portal e-procurement tanpa watermark.",
        badge: "Target Maksimal: 100 KB",
        h1: "Kompres PDF Di Bawah 100 KB",
        lead: "Solusi untuk situs pendaftaran kampus, verifikasi identitas bank, dan portal tender yang membatasi ukuran PDF maksimal 100 KB.",
        specsTitle: "Spesifikasi Dokumen <= 100 KB",
        specs: [
          { label: "Batas Ukuran Maksimal", value: "100 KB (102.400 byte)" },
          { label: "Kapasitas Ideal", value: "1 halaman dokumen teks atau scan KTP/NPWP" },
          { label: "Mode Warna Disarankan", value: "Hitam-putih / Grayscale" },
          { label: "Kompatibilitas", value: "Standar PDF universal, tanpa watermark" },
        ],
        stepsTitle: "Langkah Kompres ke <= 100 KB",
        steps: [
          {
            title: "Pilih file PDF",
            desc: "Unggah berkas yang ingin diturunkan ukurannya hingga di bawah 100 KB.",
          },
          {
            title: "Pantau status target",
            desc: "Lihat hasil ukuran akhir dan badge status <= 100 KB setelah proses selesai.",
          },
          {
            title: "Perkecil foto scan berlebih",
            desc: "Jika file berasal dari foto kamera beresolusi tinggi, kompres gambar ke <= 100 KB lalu ubah ke PDF.",
          },
        ],
        tipsTitle: "Tips Lolos Batas Ketat 100 KB",
        tips: [
          "Ekspor dokumen langsung dari Word/Google Docs ke PDF, bukan memotret layar atau kertas cetak.",
          "Jika dokumen multi-halaman perlu dipisah per lampiran, gunakan Split PDF terlebih dahulu.",
        ],
        faqs: [
          {
            q: "Apakah PDF hasil scan 5 halaman bisa jadi 100 KB?",
            a: "Untuk 1–2 halaman teks atau KTP sangat memungkinkan. Untuk 5+ halaman scan warna penuh, disarankan pisah halaman atau turunkan resolusi via PDF ke JPG terlebih dulu.",
          },
          {
            q: "Apakah QR Code atau tanda tangan digital tetap terbaca di bawah 100 KB?",
            a: "Ya, PDF berbasis vektor mempertahankan ketajaman teks, QR Code, dan tanda tangan.",
          },
          {
            q: "Perlu daftar akun dulu?",
            a: "Tidak perlu. Anda bisa langsung unggah dan unduh hasilnya.",
          },
        ],
      },
      ja: {
        seoTitle: "PDFを100KB以下に圧縮（オンライン無料）| Pdfumi",
        seoDescription:
          "本人確認書類や大学出願フォームなどの厳しい100KB制限に合わせてPDFを軽量化。透かしなしで安全に圧縮します。",
        badge: "目標サイズ: 100 KB 以下",
        h1: "PDFを100KB以下に圧縮",
        lead: "金融機関の本人確認（eKYC）や大学ポータルなど、100KB以下の厳格なサイズ制限に対応します。",
        specsTitle: "100KB制限の推奨条件",
        specs: [
          { label: "上限サイズ", value: "100 KB（102,400 バイト）" },
          { label: "適したページ数", value: "1ページ書類または単ページスキャン" },
          { label: "推奨カラー", value: "スキャン時はグレースケール推奨" },
          { label: "出力形式", value: "標準PDF・透かしなし" },
        ],
        stepsTitle: "100KB以下への圧縮手順",
        steps: [
          {
            title: "PDFを選択",
            desc: "圧縮したいPDFファイルをアップロードします。",
          },
          {
            title: "サイズチェック",
            desc: "処理後に100KB以内へ収まったか自動で確認表示されます。",
          },
          {
            title: "さらに容量を下げたいとき",
            desc: "スマホ撮影PDFは「PDFをJPG化」→「100KB以下画像圧縮」→「JPGをPDF化」で確実に削減できます。",
          },
        ],
        tipsTitle: "100KBに収めるポイント",
        tips: [
          "スマホ写真から作ったPDFはまず画像の縦横サイズを縮小すると効果的です。",
          "Word等から直接PDF書き出しした文書は100KB以下になりやすいです。",
        ],
        faqs: [
          {
            q: "スマホで撮った免許証PDFでも100KB以下になりますか？",
            a: "画像を100KB以下に圧縮してからPDFへ変換する手順を使えば、文字を読める状態で100KB未満にできます。",
          },
          {
            q: "登録やインストールは必要ですか？",
            a: "不要です。ブラウザ上からすぐにご利用いただけます。",
          },
          {
            q: "透かしは入りますか？",
            a: "一切入りません。",
          },
        ],
      },
    },
  },
  {
    slug: "compress-pdf-500kb",
    category: "pdf-size",
    toolKind: "compress-pdf-target",
    targetKb: 500,
    parentToolPath: "/tools/compress-pdf",
    parentToolName: {
      en: "Compress PDF",
      id: "Kompres PDF",
      ja: "PDF圧縮",
    },
    relatedSlugs: ["compress-pdf-200kb", "compress-pdf-1mb", "gabung-pdf-lamaran-kerja"],
    copy: {
      en: {
        seoTitle: "Compress PDF Under 500 KB Online Free | Pdfumi",
        seoDescription:
          "Optimize multi-page resumes, transcripts, and portfolios under 500 KB for job portals and scholarship applications without blurred graphics.",
        badge: "Target Limit: <= 500 KB",
        h1: "Compress PDF Under 500 KB",
        lead: "The sweet spot for CVs, academic transcripts, and multi-page job applications requiring a crisp PDF below 500 KB.",
        specsTitle: "500 KB Application Standards",
        specs: [
          { label: "Target Ceiling", value: "500 KB (512,000 bytes)" },
          { label: "Ideal Use Cases", value: "CV + Portfolio, Transcripts, Cover Letter" },
          { label: "Visual Quality", value: "High-clarity photos & crisp typography" },
          { label: "Security", value: "Encrypted upload, zero watermark" },
        ],
        stepsTitle: "Compress Your PDF Below 500 KB",
        steps: [
          {
            title: "Select your PDF",
            desc: "Drop your resume, transcript, or multi-page document.",
          },
          {
            title: "Automatic target check",
            desc: "Confirm the compressed PDF lands cleanly under 500 KB.",
          },
          {
            title: "Download & submit",
            desc: "Save your lightweight, print-sharp PDF ready for HR portals.",
          },
        ],
        tipsTitle: "Keeping Portfolios Sharp Under 500 KB",
        tips: [
          "Avoid embedding uncompressed PNG screenshots inside resumes when JPEG photos suffice.",
          "If combining multiple certificates first, use Merge PDF then run the merged file here.",
        ],
        faqs: [
          {
            q: "Can a 5-page CV or portfolio fit under 500 KB?",
            a: "Yes. Most text-and-photo CVs compress easily from several megabytes down to 150–400 KB.",
          },
          {
            q: "Will recruiters notice compression artifacts on text?",
            a: "No. Vector text remains sharp at any zoom level.",
          },
          {
            q: "Can I use this for scholarship portals?",
            a: "Yes, 500 KB is one of the most common caps on national and university scholarship portals.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres PDF Di Bawah 500 KB (CV, Ijazah, LPDP) | Pdfumi",
        seoDescription:
          "Kecilkan PDF hingga maksimal 500 KB untuk upload CV lamaran kerja, ijazah, transkrip nilai, dan syarat beasiswa tetap jernih tanpa watermark.",
        badge: "Target Maksimal: 500 KB",
        h1: "Kompres PDF Di Bawah 500 KB",
        lead: "Ukuran ideal untuk upload ijazah, transkrip nilai, CV gabungan, dan berkas BUMN atau beasiswa dengan batas maksimal 500 KB.",
        specsTitle: "Standar Portal Lamaran & Beasiswa <= 500 KB",
        specs: [
          { label: "Batas Ukuran Target", value: "Maksimal 500 KB" },
          { label: "Cocok Untuk", value: "Ijazah + Transkrip, Surat Lamaran + CV, BUMN" },
          { label: "Kualitas Dokumen", value: "Stempel, foto ijazah & teks tetap tajam" },
          { label: "Privasi", value: "Terhapus otomatis setelah selesai" },
        ],
        stepsTitle: "Cara Kompres PDF ke <= 500 KB",
        steps: [
          {
            title: "Masukkan PDF Anda",
            desc: "Unggah ijazah, CV, atau gabungan lampiran PDF yang masih melebihi 500 KB.",
          },
          {
            title: "Pantau badge target",
            desc: "Sistem langsung menandai apakah hasil akhir sudah lolos syarat <= 500 KB.",
          },
          {
            title: "Unduh & langsung upload",
            desc: "File bersih tanpa watermark, siap dikirim ke portal HRD atau SSCASN.",
          },
        ],
        tipsTitle: "Tips Dokumen Multi-Halaman Tetap Rapi",
        tips: [
          "Untuk berkas lamaran yang terdiri dari beberapa PDF terpisah, gabungkan dulu di Gabung PDF baru dikompres di sini.",
          "File ekspor dari Canva atau Figma sering memiliki gambar latar besar; kompresi akan memangkas metadata berlebih tanpa mengaburkan teks.",
        ],
        faqs: [
          {
            q: "Apakah ijazah dan legalisir tetap terbaca jelas di bawah 500 KB?",
            a: "Ya, ukuran 250–450 KB sangat cukup untuk menjaga ketajaman teks ijazah, nomor seri, dan cap legalisir.",
          },
          {
            q: "Bagaimana kalau PDF dari Canva ukurannya 12 MB?",
            a: "Canva menyimpan aset gambar tak terkompresi. Kompresi PDF akan memangkas ukuran signifikan; bila perlu, ubah ke JPG terkompres lalu ke PDF.",
          },
          {
            q: "Apakah file disimpan permanen di server?",
            a: "Tidak. Dokumen diproses sementara dan dihapus otomatis.",
          },
        ],
      },
      ja: {
        seoTitle: "PDFを500KB以下に圧縮（履歴書・ポートフォリオ向け）| Pdfumi",
        seoDescription:
          "履歴書、職務経歴書、成績証明書を画質を保ったまま500KB以下に圧縮。採用サイトや奨学金申請の容量制限に最適です。",
        badge: "目標サイズ: 500 KB 以下",
        h1: "PDFを500KB以下に圧縮",
        lead: "求人応募サイトや大学申請でよく指定される「500KB以内」にぴったり収めるための圧縮プリセットです。",
        specsTitle: "500KB制限の推奨仕様",
        specs: [
          { label: "上限サイズ", value: "500 KB（512,000 バイト）" },
          { label: "主な用途", value: "履歴書・職務経歴書・成績証明書・企画書" },
          { label: "画質バランス", value: "図表や写真も鮮明さを維持" },
          { label: "出力", value: "透かしなし・即ダウンロード" },
        ],
        stepsTitle: "500KB以下への圧縮ステップ",
        steps: [
          {
            title: "PDFをアップロード",
            desc: "500KBを超えているPDFファイルを選択します。",
          },
          {
            title: "結果を確認",
            desc: "圧縮後の容量が500KB以下になったか自動で表示します。",
          },
          {
            title: "ダウンロードして提出",
            desc: "透かしのない軽量PDFをそのまま提出できます。",
          },
        ],
        tipsTitle: "容量を抑えるポイント",
        tips: [
          "デザインツールから書き出したPDFは不要な埋め込みデータが多いため圧縮効果が高くなります。",
          "複数ファイルを先に結合したい場合は「PDF結合」でまとめてから圧縮してください。",
        ],
        faqs: [
          {
            q: "写真付きの履歴書でも500KB以下にできますか？",
            a: "はい、ほとんどのケースで証明写真を含めても150〜400KB程度に収まります。",
          },
          {
            q: "文字がぼやけることはありますか？",
            a: "フォントデータはベクターのまま維持されるため、文字はくっきり読めます。",
          },
          {
            q: "無料で使えますか？",
            a: "はい、アカウント登録不要ですぐに使えます。",
          },
        ],
      },
    },
  },
  {
    slug: "compress-pdf-1mb",
    category: "pdf-size",
    toolKind: "compress-pdf-target",
    targetKb: 1024,
    parentToolPath: "/tools/compress-pdf",
    parentToolName: {
      en: "Compress PDF",
      id: "Kompres PDF",
      ja: "PDF圧縮",
    },
    relatedSlugs: ["compress-pdf-500kb", "gabung-pdf-lamaran-kerja", "compress-pdf-200kb"],
    copy: {
      en: {
        seoTitle: "Compress PDF Under 1 MB Online Free | Pdfumi",
        seoDescription:
          "Shrink large reports, merged certificates, and academic theses below 1 MB while retaining full visual clarity and zero watermarks.",
        badge: "Target Limit: <= 1 MB",
        h1: "Compress PDF Under 1 MB",
        lead: "Ideal for merged multi-document bundles, theses, contracts, and embassy portals capped at 1 MB.",
        specsTitle: "1 MB Standard Upload Specs",
        specs: [
          { label: "Target Limit", value: "1 MB (1,024 KB)" },
          { label: "Best For", value: "Merged CV bundles, Contracts, Embassy Visas" },
          { label: "Image Fidelity", value: "High quality preserved for charts & stamps" },
          { label: "Watermark", value: "None" },
        ],
        stepsTitle: "Shrink Any PDF Below 1 MB",
        steps: [
          {
            title: "Upload your large PDF",
            desc: "Drop merged certificates, contracts, or slide decks.",
          },
          {
            title: "Check <= 1 MB target",
            desc: "Confirm the compressed document fits cleanly inside 1 MB.",
          },
          {
            title: "Download clean output",
            desc: "Use directly for visa uploads, tax filings, or client emails.",
          },
        ],
        tipsTitle: "Reducing Large Multi-Page PDFs",
        tips: [
          "PowerPoint and Canva exports often drop by 60–80% while remaining identical on screen.",
          "Remove unnecessary metadata or appendix pages before merging.",
        ],
        faqs: [
          {
            q: "Why do most job & embassy portals choose 1 MB?",
            a: "1 MB balances crisp readability for 5–15 page documents with fast server storage and email compatibility.",
          },
          {
            q: "Does compression break clickable hyperlinks inside my PDF?",
            a: "Pdfumi preserves document structure and readability during optimization.",
          },
          {
            q: "What size files can I upload?",
            a: "Free plans support up to 20 MB per PDF.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres PDF Di Bawah 1 MB (Berkas CPNS, Visa, Skripsi) | Pdfumi",
        seoDescription:
          "Kecilkan ukuran file PDF gabungan, skripsi, surat lamaran, dan dokumen visa hingga di bawah 1 MB dengan kualitas tetap jernih.",
        badge: "Target Maksimal: 1 MB",
        h1: "Kompres PDF Di Bawah 1 MB",
        lead: "Cocok untuk ijazah, transkrip nilai, akreditasi kampus, dan bundle berkas lamaran kerja yang dibatasi maksimal 1 MB.",
        specsTitle: "Spesifikasi Berkas <= 1 MB",
        specs: [
          { label: "Batas Ukuran Target", value: "1 MB (1.024 KB)" },
          { label: "Cocok Untuk", value: "Gabungan CV + Lampiran, Ijazah, Kontrak, Visa" },
          { label: "Ketajaman Visual", value: "Grafik, materai, & tanda tangan terjaga" },
          { label: "Watermark", value: "Bebas watermark" },
        ],
        stepsTitle: "Cara Kompres PDF ke <= 1 MB",
        steps: [
          {
            title: "Unggah file PDF besar",
            desc: "Pilih dokumen gabungan atau hasil ekspor presentasi/scan.",
          },
          {
            title: "Verifikasi ukuran akhir",
            desc: "Sistem mengecek otomatis apakah file sudah di bawah 1 MB.",
          },
          {
            title: "Unduh hasil bersih",
            desc: "Siap diunggah ke portal SSCASN, kedutaan, atau dikirim via email.",
          },
        ],
        tipsTitle: "Menjaga Kualitas PDF Gabungan Tetap Rapi",
        tips: [
          "Urutkan lampiran di Gabung PDF terlebih dahulu, lalu kompres sekali jalan di halaman ini.",
          "File hasil ekspor Office/Canva berukuran 5–15 MB umumnya bisa turun menjadi di bawah 1 MB tanpa pecah.",
        ],
        faqs: [
          {
            q: "Berapa halaman yang masih muat jelas di bawah 1 MB?",
            a: "Untuk dokumen teks dan scan standar, 5 hingga 15 halaman umumnya tetap sangat jelas di ukuran 400–900 KB.",
          },
          {
            q: "Apakah batas upload gratisnya cukup?",
            a: "Ya, Anda bisa mengunggah file PDF hingga 20 MB secara gratis.",
          },
          {
            q: "Apakah hasil PDF bisa dibuka di semua perangkat?",
            a: "Ya, 100% kompatibel dengan Adobe Reader, Chrome, Safari, iOS, dan Android.",
          },
        ],
      },
      ja: {
        seoTitle: "PDFを1MB以下に圧縮（契約書・申請書・資料向け）| Pdfumi",
        seoDescription:
          "複数の証明書をまとめたPDFやプレゼン資料・契約書を、画像や図表を綺麗に保ったまま1MB以下に軽量化します。",
        badge: "目標サイズ: 1 MB 以下",
        h1: "PDFを1MB以下に圧縮",
        lead: "複数ページの結合PDF、メール添付、ビザ申請や官公庁サイトで一般的な「1MB上限」に最適化します。",
        specsTitle: "1MB制限の推奨仕様",
        specs: [
          { label: "目標上限", value: "1 MB（1,024 KB）" },
          { label: "最適な用途", value: "結合PDF・契約書・提案書・電子申請書類" },
          { label: "画像品質", value: "印影や図表の視認性を維持" },
          { label: "透かし", value: "なし" },
        ],
        stepsTitle: "1MB以下に圧縮する方法",
        steps: [
          {
            title: "大容量PDFをアップロード",
            desc: "1MBを超えているPDFファイルをドロップします。",
          },
          {
            title: "目標達成を確認",
            desc: "圧縮後サイズが1MB未満か自動表示されます。",
          },
          {
            title: "保存して送信",
            desc: "メール添付や申請フォームにそのままアップロードできます。",
          },
        ],
        tipsTitle: "高品質のまま1MB未満にするコツ",
        tips: [
          "PowerPointやCanvaから書き出したPDFは余分な埋め込み画像が多いため大幅に削減できます。",
          "複数書類をまとめる場合は「PDF結合」後に圧縮すると1つの1MB以内ファイルになります。",
        ],
        faqs: [
          {
            q: "10ページ程度の資料でも1MB以下に収まりますか？",
            a: "テキスト中心や適度な図表の資料であれば、ほとんどの場合400KB〜900KB程度に収まります。",
          },
          {
            q: "アップロード上限は何MBまでですか？",
            a: "無料プランでも20MBまでのPDFを処理できます。",
          },
          {
            q: "スマートフォンからも利用できますか？",
            a: "はい、iPhone・Androidのブラウザからそのまま利用できます。",
          },
        ],
      },
    },
  },
  {
    slug: "compress-jpg-200kb",
    category: "image-size",
    toolKind: "compress-image-target",
    targetKb: 200,
    parentToolPath: "/tools/compress-jpg",
    parentToolName: {
      en: "Compress JPG",
      id: "Kompres JPG",
      ja: "JPG圧縮",
    },
    relatedSlugs: ["compress-jpg-100kb", "pas-foto-3x4-merah", "compress-pdf-200kb"],
    copy: {
      en: {
        seoTitle: "Compress JPG Image Under 200 KB Online | Pdfumi",
        seoDescription:
          "Automatically shrink JPG, PNG, or WEBP photos strictly under 200 KB inside your browser using adaptive quality tuning. Zero upload needed.",
        badge: "Client-Side Target: <= 200 KB",
        h1: "Compress Photo to Under 200 KB",
        lead: "Runs 100% locally in your browser with automatic binary-search compression so your ID photo or selfie fits under 200 KB on the first try.",
        specsTitle: "200 KB Photo Target Specs",
        specs: [
          { label: "Exact Target Ceiling", value: "<= 200 KB (auto-calibrated)" },
          { label: "Processing Mode", value: "100% Client-Side Browser Canvas" },
          { label: "Accepted Inputs", value: "JPG, JPEG, PNG, WEBP" },
          { label: "Privacy", value: "Photos never leave your device" },
        ],
        stepsTitle: "Compress Photos Under 200 KB Automatically",
        steps: [
          {
            title: "Select or drop your photo",
            desc: "Choose any large smartphone photo (even 5–15 MB).",
          },
          {
            title: "Auto-calibrate to <= 200 KB",
            desc: "Pdfumi tunes JPEG quality & dimensions automatically until the file drops below 200 KB.",
          },
          {
            title: "Download & upload",
            desc: "Save your sharp, portal-ready JPG immediately.",
          },
        ],
        tipsTitle: "Why Client-Side Target Compression Works Better",
        tips: [
          "Standard fixed-percentage compressors leave a 6 MB iPhone photo at 1.2 MB — still rejected by 200 KB forms.",
          "Our adaptive loop hits the highest visual quality possible that still stays strictly under 200 KB.",
        ],
        faqs: [
          {
            q: "Does my photo get uploaded to any server?",
            a: "No. Everything executes inside your browser memory using HTML5 Canvas — instant and 100% private.",
          },
          {
            q: "Can I upload a PNG or WEBP and get a JPG under 200 KB?",
            a: "Yes. Any PNG or WEBP photo is converted and tuned into a crisp JPG under 200 KB.",
          },
          {
            q: "Will facial details stay clear for ID verification?",
            a: "Yes. Because the optimizer stops at the highest quality below 200 KB, faces remain clear without heavy pixelation.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres Foto JPG Di Bawah 200 KB Otomatis (Pas Foto / Swafoto) | Pdfumi",
        seoDescription:
          "Kecilkan ukuran foto JPG, PNG, atau WEBP otomatis di bawah 200 KB langsung di browser untuk swafoto CPNS/SSCASN & KTP tanpa upload ke server.",
        badge: "Target Otomatis: <= 200 KB",
        h1: "Kompres Foto JPG Di Bawah 200 KB",
        lead: "Kompresi cerdas langsung di browser yang otomatis menyesuaikan kualitas dan resolusi sampai ukuran foto benar-benar di bawah 200 KB.",
        specsTitle: "Standar Swafoto & Pas Foto <= 200 KB",
        specs: [
          { label: "Batas Ukuran Otomatis", value: "Pasti <= 200 KB (kalibrasi otomatis)" },
          { label: "Lokasi Pemrosesan", value: "100% di Browser (tidak dikirim ke server)" },
          { label: "Format Didukung", value: "JPG, JPEG, PNG, WEBP -> JPG" },
          { label: "Cocok Untuk", value: "Swafoto SSCASN, Foto Profil, KTP, Marketplace" },
        ],
        stepsTitle: "Cara Kompres Foto Sampai <= 200 KB",
        steps: [
          {
            title: "Pilih foto dari HP atau laptop",
            desc: "Foto kamera 5–12 MB pun bisa langsung dimasukkan.",
          },
          {
            title: "Kalibrasi target otomatis",
            desc: "Klik kompres — sistem mencari kualitas terbaik tertinggi yang tetap di bawah 200 KB.",
          },
          {
            title: "Unduh JPG siap upload",
            desc: "Cek ukuran akhir dan langsung unggah ke formulir pendaftaran.",
          },
        ],
        tipsTitle: "Agar Swafoto & KTP Tetap Jernih Di Bawah 200 KB",
        tips: [
          "Crop dulu area kosong di sekitar wajah/KTP agar piksel 200 KB terfokus penuh ke objek utama.",
          "Jika butuh latar merah/biru 3x4 terlebih dulu, buat di Pembuat Pas Foto lalu kecilkan di sini bila melebihi 200 KB.",
        ],
        faqs: [
          {
            q: "Apakah foto KTP atau selfie saya aman?",
            a: "Sangat aman. Pemrosesan berjalan 100% di perangkat Anda sendiri tanpa mengunggah foto ke server mana pun.",
          },
          {
            q: "Kenapa kompresor biasa hasilnya masih 500 KB lebih?",
            a: "Kompresor biasa hanya memakai satu angka kualitas tetap. Alat ini otomatis menguji beberapa level kualitas & resolusi sampai pasti <= 200 KB.",
          },
          {
            q: "Bisa untuk foto PNG atau WEBP?",
            a: "Ya, PNG/WEBP otomatis dikonversi menjadi JPG bersih di bawah 200 KB.",
          },
        ],
      },
      ja: {
        seoTitle: "JPG画像を200KB以下に自動圧縮（ブラウザ完結・登録不要）| Pdfumi",
        seoDescription:
          "スマホ写真やPNG画像をサーバー送信なしでブラウザ上で自動調整し、確実に200KB以下の鮮明なJPGへ圧縮します。",
        badge: "自動目標: 200 KB 以下",
        h1: "画像を200KB以下に自動圧縮",
        lead: "品質と解像度を自動調整（バイナリサーチ）し、画質をできる限り保ったまま確実に200KB以下へ仕上げます。",
        specsTitle: "200KB画像圧縮の特徴",
        specs: [
          { label: "目標ファイルサイズ", value: "200 KB 以下（自動調整）" },
          { label: "処理方式", value: "100%ブラウザ内処理（サーバー送信なし）" },
          { label: "対応入力形式", value: "JPG / PNG / WEBP" },
          { label: "プライバシー", value: "端末から画像が外に出ない安心設計" },
        ],
        stepsTitle: "200KB以下にする手順",
        steps: [
          {
            title: "画像を選択",
            desc: "スマホで撮影した大きな写真でもそのまま選べます。",
          },
          {
            title: "自動で200KB以内に調整",
            desc: "200KBを下回る最適な品質を自動探索します。",
          },
          {
            title: "JPGを保存",
            desc: "その場でサイズ確認してダウンロードできます。",
          },
        ],
        tipsTitle: "証明写真や本人確認写真でのコツ",
        tips: [
          "背景の余白を事前に切り抜いておくと、200KBでも顔や文字がさらに鮮明になります。",
          "サーバー通信を行わないため、運転免許証やパスポート画像にも安心です。",
        ],
        faqs: [
          {
            q: "画像はサーバーに保存されますか？",
            a: "いいえ。すべてお使いのブラウザ内部で完結するため、画像は一切外部に送信されません。",
          },
          {
            q: "5MB以上のiPhone写真でも200KB以下になりますか？",
            a: "はい。必要に応じて長辺解像度も段階調整し、確実に200KB未満へ圧縮します。",
          },
          {
            q: "PNG画像にも対応していますか？",
            a: "はい。PNGやWEBPを入力しても200KB以下のJPGとして出力できます。",
          },
        ],
      },
    },
  },
  {
    slug: "compress-jpg-100kb",
    category: "image-size",
    toolKind: "compress-image-target",
    targetKb: 100,
    parentToolPath: "/tools/compress-jpg",
    parentToolName: {
      en: "Compress JPG",
      id: "Kompres JPG",
      ja: "JPG圧縮",
    },
    relatedSlugs: ["compress-jpg-200kb", "pas-foto-3x4-merah", "resize-foto-youtube-ig"],
    copy: {
      en: {
        seoTitle: "Compress JPG Under 100 KB Online (Browser-Only) | Pdfumi",
        seoDescription:
          "Shrink JPG or PNG images strictly below 100 KB in seconds inside your browser—perfect for avatars, job portals, and passport photo uploads.",
        badge: "Client-Side Target: <= 100 KB",
        h1: "Compress Image Under 100 KB",
        lead: "Automatically dials in the sharpest possible JPG quality while guaranteeing a final file size below 100 KB.",
        specsTitle: "100 KB Image Optimization Specs",
        specs: [
          { label: "Target Ceiling", value: "<= 100 KB (auto-fitted)" },
          { label: "Processing Engine", value: "Private HTML5 Canvas (0 server upload)" },
          { label: "Best Use Cases", value: "Avatars, Portal Thumbnails, ID Forms" },
          { label: "Watermark", value: "None" },
        ],
        stepsTitle: "Shrink Photos Below 100 KB",
        steps: [
          {
            title: "Choose your image",
            desc: "Drop any JPG, PNG, or WEBP file.",
          },
          {
            title: "Run automatic 100 KB calibration",
            desc: "Pdfumi lowers size cleanly without unnecessary blur.",
          },
          {
            title: "Save under 100 KB",
            desc: "Download your verified lightweight JPG immediately.",
          },
        ],
        tipsTitle: "Tips for Sharp Photos Under 100 KB",
        tips: [
          "Web avatars and forms rarely need widths above 1200 px — scaling dimensions preserves crisp edges without JPEG blockiness.",
          "Ideal for e-commerce thumbnails to keep storefront pages loading fast.",
        ],
        faqs: [
          {
            q: "Will a 4000×3000 photo fit under 100 KB cleanly?",
            a: "Yes. Pdfumi automatically scales oversized dimensions only as needed so the image stays sharp under 100 KB.",
          },
          {
            q: "Is there any limit on how many photos I can compress?",
            a: "No! Because it runs locally on your own browser, it is fast and unlimited.",
          },
          {
            q: "Are files uploaded anywhere?",
            a: "Never. Zero bytes are sent to external servers.",
          },
        ],
      },
      id: {
        seoTitle: "Kompres Foto JPG Di Bawah 100 KB Online Gratis | Pdfumi",
        seoDescription:
          "Kecilkan ukuran foto JPG atau PNG hingga pasti di bawah 100 KB langsung di browser untuk foto profil, portal kampus, dan upload form kerja.",
        badge: "Target Otomatis: <= 100 KB",
        h1: "Kompres Foto Di Bawah 100 KB",
        lead: "Menyesuaikan kualitas JPG & ukuran piksel otomatis di browser agar foto Anda pasti muat di batas ketat 100 KB.",
        specsTitle: "Spesifikasi Kompres <= 100 KB",
        specs: [
          { label: "Batas Ukuran Pasti", value: "<= 100 KB (102.400 byte)" },
          { label: "Cara Kerja", value: "Lokal 100% di Browser Anda" },
          { label: "Cocok Untuk", value: "Pas foto portal kampus, foto profil, form HRD" },
          { label: "Privasi", value: "Foto tidak pernah diunggah ke server" },
        ],
        stepsTitle: "Cara Mengecilkan Foto <= 100 KB",
        steps: [
          {
            title: "Masukkan foto",
            desc: "Unggah foto JPG, PNG, atau WEBP dari galeri atau komputer.",
          },
          {
            title: "Klik kompres target 100 KB",
            desc: "Sistem otomatis mengoptimalkan ukuran hingga lolos batas 100 KB.",
          },
          {
            title: "Unduh hasil JPG",
            desc: "Foto siap dipakai di form pendaftaran yang membatasi ukuran sangat kecil.",
          },
        ],
        tipsTitle: "Agar Gambar Tidak Pecah Di Bawah 100 KB",
        tips: [
          "Untuk pas foto 3x4 atau 4x6, ukuran di bawah 100 KB masih sangat tajam karena dimensi fisiknya kecil.",
          "Cocok juga untuk thumbnail produk toko online agar website lebih cepat dibuka.",
        ],
        faqs: [
          {
            q: "Apakah hasilnya pasti di bawah 100 KB?",
            a: "Ya, algoritma kalibrasi akan menurunkan kualitas & resolusi secara bertahap sampai ukuran file <= 100 KB.",
          },
          {
            q: "Apakah foto pas foto wajah jadi buram?",
            a: "Tidak, karena sistem memilih kualitas tertinggi yang masih muat di bawah 100 KB.",
          },
          {
            q: "Apakah gratis dan tanpa batas?",
            a: "Gratis dan tanpa batas pemakaian karena diproses langsung oleh browser Anda.",
          },
        ],
      },
      ja: {
        seoTitle: "JPG画像を100KB以下に圧縮（ブラウザ処理で高速・安全）| Pdfumi",
        seoDescription:
          "プロフィール写真やWeb申請用の画像をサーバー送信なしで100KB以下のJPGに自動圧縮。画質劣化を最小限に抑えます。",
        badge: "自動目標: 100 KB 以下",
        h1: "画像を100KB以下に圧縮",
        lead: "プロフィール画像や証明写真アップロードで求められる「100KB以内」に自動で合わせるブラウザ完結型ツールです。",
        specsTitle: "100KB画像圧縮の仕様",
        specs: [
          { label: "目標上限", value: "100 KB 以下（自動調整）" },
          { label: "処理環境", value: "ブラウザローカル処理（送信なし）" },
          { label: "用途例", value: "証明写真アップロード・EC商品画像・アイコン" },
          { label: "透かし", value: "なし" },
        ],
        stepsTitle: "100KB以下に圧縮する手順",
        steps: [
          {
            title: "画像を選択",
            desc: "JPG、PNG、WEBPファイルを選びます。",
          },
          {
            title: "100KB以下に自動最適化",
            desc: "最適な圧縮率とサイズを自動計算します。",
          },
          {
            title: "保存して利用",
            desc: "ダウンロード後すぐにご利用いただけます。",
          },
        ],
        tipsTitle: "綺麗に100KB以下に収めるコツ",
        tips: [
          "Webフォーム用であれば長辺1000〜1280px程度に抑えることでブロックノイズを防げます。",
          "回数制限なく無料で何枚でも圧縮できます。",
        ],
        faqs: [
          {
            q: "何枚でも無料で圧縮できますか？",
            a: "はい。ブラウザ内で処理するためサーバー負荷がなく無制限で使えます。",
          },
          {
            q: "証明写真に使っても問題ない画質ですか？",
            a: "100KBの上限ギリギリまで高画質を保つ仕組みのため、顔写真もくっきり残ります。",
          },
          {
            q: "スマホでも動きますか？",
            a: "はい、iPhone・Androidどちらでも動作します。",
          },
        ],
      },
    },
  },
  {
    slug: "pas-foto-3x4-merah",
    category: "photo-id",
    toolKind: "pas-foto",
    parentToolPath: "/tools/pas-foto",
    parentToolName: {
      en: "ID & Passport Photo Maker",
      id: "Buat Pas Foto Online",
      ja: "証明写真作成",
    },
    relatedSlugs: ["pas-foto-4x6-skck", "pas-foto-visa-jepang-2x2", "compress-jpg-200kb"],
    copy: {
      en: {
        seoTitle: "3x4 cm ID Photo Maker (Red & Blue Background, 300 DPI) | Pdfumi",
        seoDescription:
          "Create crisp 3x4 cm (354x472 px) ID photos with red or blue backgrounds for university exams, civil service portals, and certificates.",
        badge: "Preset: 3 x 4 cm (354 x 472 px)",
        h1: "3x4 cm ID Photo Maker (Red & Blue BG)",
        lead: "Exact 300 DPI dimensions (354 × 472 px) with instant red/blue background replacement and face framing guides.",
        specsTitle: "Standard 3x4 cm Photo Specifications",
        specs: [
          { label: "Exact Pixel Size (300 DPI)", value: "354 × 472 pixels" },
          { label: "Physical Print Size", value: "3.0 × 4.0 cm (27.9 × 38.1 mm official print)" },
          { label: "Red Background Hex", value: "#D32F2F (Standard Formal Red)" },
          { label: "Blue Background Hex", value: "#1976D2 (Standard Formal Blue)" },
        ],
        stepsTitle: "Create Your 3x4 ID Photo",
        steps: [
          {
            title: "Upload portrait photo",
            desc: "Use a front-facing photo taken against a plain wall.",
          },
          {
            title: "Pick 3x4 cm & background color",
            desc: "Select 3 × 4 cm and choose Red, Blue, or White background.",
          },
          {
            title: "Align face & download",
            desc: "Center head inside the oval guide and export crisp print-ready JPG.",
          },
        ],
        tipsTitle: "Tips for Clean Background Replacement",
        tips: [
          "Stand 1 meter away from a plain wall to minimize shadows behind your shoulders.",
          "Adjust the background tolerance slider if edges near hair need smoothing.",
        ],
        faqs: [
          {
            q: "What pixel size is 3x4 cm at 300 DPI?",
            a: "354 × 472 pixels, ensuring razor-sharp print quality at photo studios and digital upload portals.",
          },
          {
            q: "Can I swap a white wall background to red or blue?",
            a: "Yes. Enable automatic background replacement and use the color picker if needed.",
          },
          {
            q: "Are my portrait photos uploaded to any server?",
            a: "No, background keying and cropping happen entirely inside your browser.",
          },
        ],
      },
      id: {
        seoTitle: "Buat Pas Foto 3x4 Latar Merah & Biru (354x472 px) | Pdfumi",
        seoDescription:
          "Ubah ukuran foto ke pas foto 3x4 cm (354x472 px) dan ganti background merah atau biru otomatis untuk ijazah, CPNS, sekolah, dan lamaran kerja.",
        badge: "Standar 300 DPI: 354 x 472 px",
        h1: "Buat Pas Foto 3x4 Latar Merah & Biru",
        lead: "Ukuran presisi 3 × 4 cm siap cetak dan siap upload portal CPNS/ijazah, lengkap dengan pengganti latar merah/biru otomatis.",
        specsTitle: "Aturan Resmi Pas Foto 3x4 Indonesia",
        specs: [
          { label: "Dimensi Cetak 300 DPI", value: "354 × 472 piksel (Rasio 3:4)" },
          { label: "Latar Merah (#D32F2F)", value: "Umumnya untuk tahun lahir ganjil / CPNS" },
          { label: "Latar Biru (#1976D2)", value: "Umumnya untuk tahun lahir genap / ijazah" },
          { label: "Privasi", value: "100% diproses di browser tanpa upload" },
        ],
        stepsTitle: "Cara Membuat Pas Foto 3x4",
        steps: [
          {
            title: "Unggah foto selfie / potret",
            desc: "Gunakan foto menghadap kamera dengan pencahayaan wajah merata.",
          },
          {
            title: "Pilih ukuran 3x4 & warna latar",
            desc: "Pilih preset 3 × 4 cm lalu klik latar Merah atau Biru sesuai syarat instansi.",
          },
          {
            title: "Atur posisi kepala & unduh",
            desc: "Posisikan wajah di dalam garis panduan oval lalu simpan hasilnya.",
          },
        ],
        tipsTitle: "Agar Potongan Latar Rapi & Natural",
        tips: [
          "Gunakan baju berbeda warna dari latar (misal kemeja putih untuk latar merah/biru).",
          "Jika foto awal berukuran > 200 KB saat ingin diupload ke SSCASN, kecilkan hasilnya memakai tool Kompres JPG <= 200 KB.",
        ],
        faqs: [
          {
            q: "Berapa piksel ukuran pas foto 3x4 standar?",
            a: "Pada standar cetak 300 DPI, ukuran pas foto 3x4 adalah 354 × 472 piksel.",
          },
          {
            q: "Kapan memakai background merah dan kapan biru?",
            a: "Untuk dokumen kependudukan/KUA/CPNS tertentu, tahun lahir ganjil memakai merah dan genap memakai biru — atau ikuti syarat spesifik di pengumuman instansi.",
          },
          {
            q: "Apakah foto wajah dikirim ke server?",
            a: "Tidak. Pengeditan dan penggantian warna background berjalan sepenuhnya di perangkat Anda.",
          },
        ],
      },
      ja: {
        seoTitle: "履歴書・証明写真 3x4 cm 作成ツール（背景色変更対応）| Pdfumi",
        seoDescription:
          "履歴書や資格試験向けの30×40mm（354×472px）証明写真をブラウザ上で簡単に作成。青・白・赤の背景変更や位置ガイド付き。",
        badge: "300 DPI 基準: 354 × 472 px",
        h1: "証明写真 3×4 cm 作成ツール",
        lead: "日本の履歴書サイズ（30×40mm / 354×472px）に対応し、顔位置ガイドと背景色調整を無料で行えます。",
        specsTitle: "履歴書用 3×4cm 推奨規格",
        specs: [
          { label: "推奨ピクセル (300 DPI)", value: "354 × 472 px" },
          { label: "実寸サイズ", value: "縦 40 mm × 横 30 mm" },
          { label: "背景色", value: "青（推奨）・白・グレー等から選択" },
          { label: "プライバシー", value: "端末内で処理・サーバー保存なし" },
        ],
        stepsTitle: "3×4証明写真の作り方",
        steps: [
          {
            title: "正面写真をアップロード",
            desc: "無地の壁の前で撮影した正面写真を選びます。",
          },
          {
            title: "3×4と背景色を選択",
            desc: "プリセットから「3 × 4 cm」と背景色を指定します。",
          },
          {
            title: "ガイドに合わせて保存",
            desc: "顔の大きさをガイドに調整し、高画質JPGをダウンロードします。",
          },
        ],
        tipsTitle: "綺麗に仕上げるコツ",
        tips: [
          "頭の上の余白（約4mm）を確保できるようガイドライン内に顔を収めてください。",
          "データ提出で容量制限がある場合は「200KB画像圧縮」でサイズ調整できます。",
        ],
        faqs: [
          {
            q: "日本の履歴書（JIS規格）に使えますか？",
            a: "はい。30×40mm（3:4比率）にぴったり合わせて出力されるため、Web提出にも印刷にもそのまま使えます。",
          },
          {
            q: "白壁で撮った写真の背景を青に変えられますか？",
            a: "はい、自動背景置換機能でワンクリック変更できます。",
          },
          {
            q: "アップロードした写真は安全ですか？",
            a: "ブラウザ上で完結するため外部送信は一切行われません。",
          },
        ],
      },
    },
  },
  {
    slug: "pas-foto-4x6-skck",
    category: "photo-id",
    toolKind: "pas-foto",
    parentToolPath: "/tools/pas-foto",
    parentToolName: {
      en: "ID & Passport Photo Maker",
      id: "Buat Pas Foto Online",
      ja: "証明写真作成",
    },
    relatedSlugs: ["pas-foto-3x4-merah", "pas-foto-visa-jepang-2x2", "compress-jpg-200kb"],
    copy: {
      en: {
        seoTitle: "4x6 cm ID Photo Maker (472x709 px, 300 DPI) | Pdfumi",
        seoDescription:
          "Crop and change backgrounds for official 4x6 cm (472x709 px) portrait photos used in police clearance (SKCK), official IDs, and print sheets.",
        badge: "Preset: 4 x 6 cm (472 x 709 px)",
        h1: "4x6 cm Official ID Photo Maker",
        lead: "Built for official clearance forms, police certificates, and administrative permits requiring exact 4 × 6 cm framing.",
        specsTitle: "Standard 4x6 cm Photo Specifications",
        specs: [
          { label: "Pixel Dimensions (300 DPI)", value: "472 × 709 pixels" },
          { label: "Physical Aspect Ratio", value: "2 : 3 (4.0 × 6.0 cm)" },
          { label: "Recommended Background", value: "Red (#D32F2F) or Blue (#1976D2)" },
          { label: "Processing", value: "Browser-only, private & instant" },
        ],
        stepsTitle: "Create 4x6 cm Photos in Seconds",
        steps: [
          {
            title: "Load your photo",
            desc: "Drop any clear portrait taken in good lighting.",
          },
          {
            title: "Select 4 × 6 cm preset",
            desc: "Switch the preset to 4 × 6 cm and select the required backdrop color.",
          },
          {
            title: "Position & export",
            desc: "Fine-tune zoom and save print-ready 472 × 709 px output.",
          },
        ],
        tipsTitle: "Framing Best Practices",
        tips: [
          "Keep both shoulders level and centered beneath the chin.",
          "Remove glasses with strong glare before snapping your portrait.",
        ],
        faqs: [
          {
            q: "What pixel resolution is 4x6 cm at 300 DPI?",
            a: "472 × 709 pixels — the standard print-shop resolution across Indonesia and Asia.",
          },
          {
            q: "Can I use this for online SKCK registration?",
            a: "Yes. SKCK online usually requires a red background with neat formal attire.",
          },
          {
            q: "Is the download free of watermarks?",
            a: "Yes, every exported photo is clean.",
          },
        ],
      },
      id: {
        seoTitle: "Buat Pas Foto 4x6 Online (SKCK, Kedinasan, KUA) | Pdfumi",
        seoDescription:
          "Buat pas foto 4x6 cm (472x709 px) latar merah atau biru untuk syarat SKCK, pernikahan KUA, dan sekolah kedinasan gratis tanpa watermark.",
        badge: "Standar 300 DPI: 472 x 709 px",
        h1: "Pas Foto 4x6 Online (SKCK & Kedinasan)",
        lead: "Preset pas foto ukuran 4 × 6 cm standar 300 DPI untuk pengurusan SKCK Polri, buku nikah KUA, paspor/pelatihan kerja.",
        specsTitle: "Ketentuan Pas Foto 4x6 Resmi",
        specs: [
          { label: "Ukuran Piksel (300 DPI)", value: "472 × 709 piksel" },
          { label: "SKCK Online / Polri", value: "Latar Merah (#D32F2F), pakaian berkerah rapi" },
          { label: "Buku Nikah / KUA", value: "Umumnya Latar Biru (#1976D2)" },
          { label: "Keamanan", value: "Diproses lokal 100% di browser" },
        ],
        stepsTitle: "Cara Buat Pas Foto 4x6 Siap Cetak",
        steps: [
          {
            title: "Unggah foto wajah",
            desc: "Pilih foto setengah badan yang menghadap lurus ke depan.",
          },
          {
            title: "Pilih ukuran 4x6 & warna latar",
            desc: "Klik preset 4 × 6 cm dan pilih latar Merah (SKCK) atau Biru (KUA).",
          },
          {
            title: "Sesuaikan & unduh JPG",
            desc: "Atur zoom sampai proporsional lalu simpan untuk cetak atau upload online.",
          },
        ],
        tipsTitle: "Tips Foto SKCK & KUA Langsung Diterima",
        tips: [
          "Gunakan pakaian berkerah/kemeja warna kontras terhadap warna latar.",
          "Pastikan pencahayaan terang dan kedua telinga atau garis wajah terlihat jelas.",
        ],
        faqs: [
          {
            q: "Latar belakang foto SKCK warna apa?",
            a: "Persyaratan SKCK Polri menggunakan latar belakang warna merah.",
          },
          {
            q: "Berapa piksel ukuran pas foto 4x6?",
            a: "472 × 709 piksel pada ketajaman cetak 300 DPI.",
          },
          {
            q: "Apakah aman dipakai untuk foto resmi?",
            a: "Ya, tidak ada gambar yang dikirim ke server; semua proses di perangkat Anda.",
          },
        ],
      },
      ja: {
        seoTitle: "4x6 cm 証明写真作成ツール（472×709 px・背景色変更）| Pdfumi",
        seoDescription:
          "40×60mm（472×709px / 300DPI）の証明写真サイズにトリミング＆背景色変更をブラウザ内で実行。免許・証明書・公的手続きに最適です。",
        badge: "300 DPI 基準: 472 × 709 px",
        h1: "証明写真 4×6 cm 作成ツール",
        lead: "40×60mm（2:3比率）の大型証明写真フォーマットを、顔ガイド付きで高精度に作成できます。",
        specsTitle: "4×6cm 写真スペック",
        specs: [
          { label: "ピクセル数 (300 DPI)", value: "472 × 709 px" },
          { label: "比率", value: "2 : 3（縦 60 mm × 横 40 mm）" },
          { label: "背景選択", value: "赤 / 青 / 白 / 元画像そのまま" },
          { label: "処理方式", value: "ブラウザ内処理・透かしなし" },
        ],
        stepsTitle: "作成ステップ",
        steps: [
          {
            title: "写真を読み込む",
            desc: "正面のポートレート画像を選択します。",
          },
          {
            title: "4 × 6 cm を選択",
            desc: "プリセットから4×6cmと必要な背景色を選びます。",
          },
          {
            title: "位置を調整して保存",
            desc: "ガイドに沿って配置を整えダウンロードします。",
          },
        ],
        tipsTitle: "撮影のアドバイス",
        tips: [
          "肩が水平になるように正面から撮影すると仕上がりが綺麗です。",
          "眼鏡の反射が入らないよう明るさを調整してください。",
        ],
        faqs: [
          {
            q: "4×6cmの解像度は何ピクセルですか？",
            a: "印刷基準の300DPIで 472 × 709 ピクセルです。",
          },
          {
            q: "透かしやロゴは入りますか？",
            a: "入りません。印刷やオンライン申請にそのままご利用いただけます。",
          },
          {
            q: "サーバーに保存されますか？",
            a: "いいえ、端末のブラウザ内のみで処理されます。",
          },
        ],
      },
    },
  },
  {
    slug: "pas-foto-visa-jepang-2x2",
    category: "photo-id",
    toolKind: "pas-foto",
    parentToolPath: "/tools/pas-foto",
    parentToolName: {
      en: "ID & Passport Photo Maker",
      id: "Buat Pas Foto Online",
      ja: "証明写真作成",
    },
    relatedSlugs: ["pas-foto-3x4-merah", "pas-foto-4x6-skck", "compress-jpg-200kb"],
    copy: {
      en: {
        seoTitle: "Passport & Japan Visa Photo Maker (2x2 in / White BG) | Pdfumi",
        seoDescription:
          "Create crisp 600x600 px (2x2 inch / 45x45 mm) white-background biometric photos for passports, Japan visas, and US DS-160 forms.",
        badge: "ICAO Spec: 600 x 600 px (White BG)",
        h1: "Passport & Visa Photo Maker (2x2\" / White BG)",
        lead: "Formatted for international visa and passport rules requiring a clean neutral white background and square 600 × 600 px framing.",
        specsTitle: "Passport / Visa Biometric Rules",
        specs: [
          { label: "Digital Output Size", value: "600 × 600 px (1:1 Square / 300 DPI)" },
          { label: "Compatible Standards", value: "US DS-160 (2×2 in), Japan Visa (45×45 mm), Schengen crop base" },
          { label: "Background Color", value: "Pure Neutral White (#FFFFFF)" },
          { label: "Privacy", value: "100% browser-side rendering" },
        ],
        stepsTitle: "Prepare Your Visa Photo",
        steps: [
          {
            title: "Upload neutral portrait",
            desc: "Keep neutral facial expression, mouth closed, both eyes open.",
          },
          {
            title: "Pick Passport (2×2\") + White BG",
            desc: "Select the 600 × 600 px preset and White background.",
          },
          {
            title: "Verify face guide & save",
            desc: "Align head height comfortably inside the guide oval and export.",
          },
        ],
        tipsTitle: "Common Reasons Visa Photos Get Rejected",
        tips: [
          "Avoid harsh shadows across one side of the face or heavy beauty filters.",
          "Remove eyeglasses and hats (except religious headwear keeping full face visible).",
        ],
        faqs: [
          {
            q: "Does 600×600 px match US DS-160 and Japan 45×45mm requirements?",
            a: "Yes. Both standards use a 1:1 square aspect ratio; 600×600 px satisfies US digital upload minimums and prints cleanly at 45×45 mm.",
          },
          {
            q: "Can I use a slightly off-white home wall?",
            a: "Yes — the automatic background replacement turns off-white walls into clean pure #FFFFFF white.",
          },
          {
            q: "Should I smile in passport or visa photos?",
            a: "No, always maintain a relaxed, neutral expression with mouth closed.",
          },
        ],
      },
      id: {
        seoTitle: "Buat Foto Visa Jepang & Paspor (600x600 px Latar Putih) | Pdfumi",
        seoDescription:
          "Buat foto paspor, visa Jepang (45x45 mm), dan visa Amerika DS-160 (2x2 inci / 600x600 px) dengan latar putih bersih langsung di browser.",
        badge: "Standar ICAO: 600 x 600 px Putih",
        h1: "Foto Paspor & Visa Latar Putih (2x2\" / 45x45mm)",
        lead: "Siapkan foto visa Jepang, visa AS (DS-160), dan aplikasi luar negeri berlatar putih bersih (#FFFFFF) tanpa harus ke studio foto.",
        specsTitle: "Standar Biometrik Visa & Paspor",
        specs: [
          { label: "Resolusi Digital", value: "600 × 600 px (Rasio 1:1 / 300 DPI)" },
          { label: "Standar Didukung", value: "Visa Jepang (45×45 mm) & Visa AS DS-160 (2×2 inci)" },
          { label: "Warna Latar", value: "Putih Bersih (#FFFFFF)" },
          { label: "Keamanan", value: "Diproses lokal di browser tanpa upload" },
        ],
        stepsTitle: "Cara Buat Foto Visa Latar Putih",
        steps: [
          {
            title: "Unggah foto wajah netral",
            desc: "Ekspresi wajah rileks, mulut tertutup, mata terbuka jelas menghadap kamera.",
          },
          {
            title: "Pilih Preset Paspor (2×2\") + Latar Putih",
            desc: "Klik preset Paspor dan pastikan latar diset ke Putih (#FFFFFF).",
          },
          {
            title: "Posisikan sesuai panduan & unduh",
            desc: "Pastikan bagian atas kepala hingga dagu pas di dalam oval panduan.",
          },
        ],
        tipsTitle: "Agar Foto Visa Tidak Ditolak Kedutaan",
        tips: [
          "Lepas kacamata dan jangan memakai filter kamera yang mengubah bentuk wajah.",
          "Pastikan tidak ada bayangan gelap di belakang telinga atau leher.",
        ],
        faqs: [
          {
            q: "Apakah ukuran 600×600 px cocok untuk syarat visa Jepang?",
            a: "Ya. Visa Jepang menggunakan rasio persegi 4,5 × 4,5 cm (1:1) dengan latar belakang putih polos.",
          },
          {
            q: "Apakah aman dipakai jika ukuran file harus di bawah 240 KB untuk DS-160?",
            a: "Jika ukuran file melebihi batas DS-160, lanjutkan kompresi lewat Kompres JPG <= 200 KB agar langsung lolos.",
          },
          {
            q: "Apakah berbayar atau ada watermark?",
            a: "Tidak ada watermark, bisa diunduh dan langsung digunakan.",
          },
        ],
      },
      ja: {
        seoTitle: "パスポート・ビザ用写真作成（45×45mm / 2×2インチ 白背景）| Pdfumi",
        seoDescription:
          "日本パスポート・米国ビザ（DS-160 / 600×600px）向けの白背景正方形写真をブラウザ上で無料作成。外枠ガイド付き。",
        badge: "国際規格: 600 × 600 px 白背景",
        h1: "パスポート・ビザ用 証明写真作成",
        lead: "海外ビザ（米国DS-160や45×45mm申請）で必須となる純白背景（#FFFFFF）・正方形600×600pxを即作成します。",
        specsTitle: "ビザ・パスポート用推奨規格",
        specs: [
          { label: "出力ピクセル", value: "600 × 600 px（1:1 正方形）" },
          { label: "対応用途", value: "米国ビザDS-160・各種45×45mmビザ・資格申請" },
          { label: "背景指定", value: "白背景（#FFFFFF）" },
          { label: "プライバシー", value: "サーバー送信なし・ブラウザ完結" },
        ],
        stepsTitle: "作成方法",
        steps: [
          {
            title: "真顔の正面写真を用意",
            desc: "無表情で口を閉じ、正面を向いた写真を読み込みます。",
          },
          {
            title: "パスポート規格＋白背景を選択",
            desc: "「Paspor (2×2\")」と白背景を選択します。",
          },
          {
            title: "頭部の位置を合わせて保存",
            desc: "ガイド枠に顔を合わせてダウンロードします。",
          },
        ],
        tipsTitle: "審査で弾かれないための注意点",
        tips: [
          "眼鏡は外し、美肌加工アプリなどによる輪郭補正は使用しないでください。",
          "DS-160の240KB制限に合わせる場合は「200KB以下圧縮」と併用すると確実です。",
        ],
        faqs: [
          {
            q: "米国ビザ（DS-160）の600×600px規格を満たしていますか？",
            a: "はい、600×600pxの正方形JPGで出力されるためDS-160仕様に適合します。",
          },
          {
            q: "自宅の少し暗い壁で撮った写真でも白背景にできますか？",
            a: "はい、背景置換機能で純白の #FFFFFF に置き換えられます。",
          },
          {
            q: "日本のパスポート申請（35×45mm）とはサイズが違いますか？",
            a: "日本のパスポートは縦長35×45mmですが、ビザやDS-160等の45×45mm・2×2インチ用途では本プリセットが最適です。",
          },
        ],
      },
    },
  },
  {
    slug: "resize-foto-youtube-ig",
    category: "image-size",
    toolKind: "resize-image",
    parentToolPath: "/tools/resize-image",
    parentToolName: {
      en: "Resize Image",
      id: "Ubah Ukuran Foto",
      ja: "画像リサイズ",
    },
    relatedSlugs: ["compress-jpg-200kb", "pas-foto-3x4-merah", "compress-jpg-100kb"],
    copy: {
      en: {
        seoTitle: "Resize Images for YouTube, TikTok & Instagram | Pdfumi",
        seoDescription:
          "Resize photos cleanly to 1280x720 YouTube thumbnails, 1080x1920 TikTok/Reels, and 1080x1080 Instagram posts in your browser.",
        badge: "Creator Presets: 16:9 / 9:16 / 1:1",
        h1: "Resize Photos for YouTube, TikTok & Instagram",
        lead: "One-click dimension presets for creators: YouTube thumbnails, vertical Shorts/Reels, square Instagram feeds, and Full HD banners.",
        specsTitle: "2026 Social Media Image Dimensions",
        specs: [
          { label: "YouTube Thumbnail (16:9)", value: "1280 × 720 px (max 2 MB)" },
          { label: "TikTok / Reels / Shorts (9:16)", value: "1080 × 1920 px" },
          { label: "Instagram Square (1:1)", value: "1080 × 1080 px" },
          { label: "Open Graph / Web Banner", value: "1200 × 630 px" },
        ],
        stepsTitle: "Resize Any Creator Image",
        steps: [
          {
            title: "Drop your raw image",
            desc: "Upload PNG, JPG, or WEBP artwork.",
          },
          {
            title: "Click a social preset",
            desc: "Pick YouTube Thumbnail, Reels/TikTok, or Instagram Square with optional aspect lock.",
          },
          {
            title: "Choose format & export",
            desc: "Export in crisp JPG, PNG, or fast-loading WEBP.",
          },
        ],
        tipsTitle: "Keep Thumbnails & Covers Crisp",
        tips: [
          "Export YouTube thumbnails at 1280 × 720 px in JPG quality 90% so file size stays well under YouTube's 2 MB ceiling.",
          "Convert blog banners to WEBP for faster Core Web Vitals.",
        ],
        faqs: [
          {
            q: "Does resizing stretch my image?",
            a: "Not when aspect-ratio lock is enabled — dimensions scale proportionally unless you unlock it intentionally.",
          },
          {
            q: "Which format is smallest for web banners?",
            a: "WEBP produces 25–35% smaller files than JPG at equivalent visual quality.",
          },
          {
            q: "Is image resizing processed locally?",
            a: "Yes, 100% browser-based with instant download.",
          },
        ],
      },
      id: {
        seoTitle: "Ubah Ukuran Foto YouTube Thumbnail, TikTok & Instagram | Pdfumi",
        seoDescription:
          "Resize gambar ke ukuran presisi YouTube Thumbnail (1280x720), Reels/TikTok (1080x1920), dan Instagram (1080x1080) langsung di browser.",
        badge: "Preset Kreator: 16:9 / 9:16 / 1:1",
        h1: "Ubah Ukuran Foto YouTube, TikTok & Instagram",
        lead: "Siapkan ukuran piksel presisi untuk thumbnail YouTube, cover TikTok/Reels, feed Instagram, hingga banner web dalam satu klik.",
        specsTitle: "Daftar Ukuran Gambar Media Sosial",
        specs: [
          { label: "YouTube Thumbnail (16:9)", value: "1280 × 720 px (batas maks 2 MB)" },
          { label: "TikTok / Reels / Shorts (9:16)", value: "1080 × 1920 px" },
          { label: "Instagram Kotak (1:1)", value: "1080 × 1080 px" },
          { label: "Banner Blog / Open Graph", value: "1200 × 630 px" },
        ],
        stepsTitle: "Cara Resize Foto Kreator",
        steps: [
          {
            title: "Unggah gambar mentah",
            desc: "Masukkan file JPG, PNG, atau WEBP dari komputer atau HP.",
          },
          {
            title: "Pilih preset platform",
            desc: "Klik preset YouTube Thumbnail, Reels/TikTok, atau Instagram Square.",
          },
          {
            title: "Pilih format & unduh",
            desc: "Ekspor ke JPG, PNG, atau WEBP dengan kualitas tajam.",
          },
        ],
        tipsTitle: "Tips Agar Thumbnail Tidak Ditolak atau Buram",
        tips: [
          "YouTube menolak thumbnail di atas 2 MB — gunakan format JPG kualitas 85–90% pada 1280 × 720 px.",
          "Aktifkan kunci rasio aspek bila tidak ingin gambar terlihat gepeng.",
        ],
        faqs: [
          {
            q: "Apakah gambar akan tertarik atau gepeng saat di-resize?",
            a: "Selama ikon kunci rasio aktif, tinggi dan lebar akan menyesuaikan secara proporsional.",
          },
          {
            q: "Bisa sekaligus ubah PNG ke WEBP atau JPG?",
            a: "Ya, Anda bisa memilih format output JPEG, PNG, maupun WEBP sebelum mengunduh.",
          },
          {
            q: "Apakah ada watermark?",
            a: "Tidak ada watermark sama sekali.",
          },
        ],
      },
      ja: {
        seoTitle: "YouTube・TikTok・Instagram用 画像リサイズツール | Pdfumi",
        seoDescription:
          "YouTubeサムネイル（1280×720）、TikTok/リール（1080×1920）、Instagram投稿（1080×1080）の最適サイズにブラウザ上で変換。",
        badge: "SNSプリセット: 16:9 / 9:16 / 1:1",
        h1: "YouTube・TikTok・SNS用 画像リサイズ",
        lead: "YouTubeサムネイル、縦型ショート動画カバー、Instagram正方形投稿のサイズをワンクリックで切り替えられます。",
        specsTitle: "主要SNSの推奨画像サイズ",
        specs: [
          { label: "YouTubeサムネイル (16:9)", value: "1280 × 720 px（上限2MB）" },
          { label: "TikTok / ショート (9:16)", value: "1080 × 1920 px" },
          { label: "Instagram正方形 (1:1)", value: "1080 × 1080 px" },
          { label: "ブログ・OGP画像", value: "1200 × 630 px" },
        ],
        stepsTitle: "リサイズ手順",
        steps: [
          {
            title: "画像をドロップ",
            desc: "JPG、PNG、WEBP画像を読み込みます。",
          },
          {
            title: "SNSプリセットをクリック",
            desc: "目的のSNSサイズを選び、必要に応じて縦横比ロックを切り替えます。",
          },
          {
            title: "形式を選んで保存",
            desc: "JPEG / PNG / WEBPから出力形式を指定して保存します。",
          },
        ],
        tipsTitle: "画質を保つコツ",
        tips: [
          "YouTubeサムネイルは1280×720pxのJPEG品質90%前後にすると2MB制限に収まりやすく高精細です。",
          "Web用バナーはWEBP出力にするとページ表示が高速化します。",
        ],
        faqs: [
          {
            q: "縦横比を保ったまま縮小できますか？",
            a: "はい、比率ロックが初期状態でオンになっているため歪まず縮小できます。",
          },
          {
            q: "PNGからJPEGへの変換も同時にできますか？",
            a: "はい、出力形式セレクトでそのまま変換保存できます。",
          },
          {
            q: "利用料金はかかりますか？",
            a: "ブラウザ上で無料・無制限でご利用いただけます。",
          },
        ],
      },
    },
  },
  {
    slug: "gabung-pdf-lamaran-kerja",
    category: "workflow",
    toolKind: "merge-pdf",
    parentToolPath: "/tools/merge-pdf",
    parentToolName: {
      en: "Merge PDF",
      id: "Gabung PDF",
      ja: "PDF結合",
    },
    relatedSlugs: ["compress-pdf-500kb", "compress-pdf-1mb", "hapus-background-tanda-tangan-word-pdf"],
    copy: {
      en: {
        seoTitle: "Merge CV, Cover Letter & Certificates Into One PDF | Pdfumi",
        seoDescription:
          "Combine cover letter, resume, diplomas, and certificates into one ordered job-application PDF without watermarks or page distortion.",
        badge: "Career Bundle Workflow",
        h1: "Merge Job Application Documents Into One PDF",
        lead: "Drag, reorder, rotate crooked scans, and combine your cover letter, resume, transcripts, and certificates into one polished PDF.",
        specsTitle: "Recommended Document Order for HR",
        specs: [
          { label: "Page 1", value: "Cover Letter / Application Letter" },
          { label: "Pages 2–3", value: "Curriculum Vitae / Resume" },
          { label: "Following Pages", value: "ID / Diploma / Transcripts / Certificates" },
          { label: "Recommended Final Size", value: "Compress <= 500 KB or <= 1 MB if needed" },
        ],
        stepsTitle: "Build Your Application Bundle",
        steps: [
          {
            title: "Drop all PDF files together",
            desc: "Upload your cover letter, CV, and supporting scans at once.",
          },
          {
            title: "Reorder & rotate sideways scans",
            desc: "Drag cards into HR-recommended sequence and fix rotated pages.",
          },
          {
            title: "Preview & download",
            desc: "Download your unified PDF, then shrink under 500 KB or 1 MB if required.",
          },
        ],
        tipsTitle: "Before Sending to Recruiters",
        tips: [
          "Name your final PDF professionally (e.g., FullName_Role_Application.pdf).",
          "Keep total bundle under 1 MB for fast opening on recruiter phones.",
        ],
        faqs: [
          {
            q: "Can I rotate a sideways diploma scan before merging?",
            a: "Yes. Each file card includes rotation controls before creating the final merged PDF.",
          },
          {
            q: "What if the combined PDF is too big for an email or HR portal?",
            a: "Run the merged file through our Compress PDF Under 500 KB or Under 1 MB tool right after downloading.",
          },
          {
            q: "Are watermarks added between merged files?",
            a: "Never. Pages stitch cleanly in order.",
          },
        ],
      },
      id: {
        seoTitle: "Gabung PDF Berkas Lamaran Kerja & CV Jadi Satu File | Pdfumi",
        seoDescription:
          "Satukan surat lamaran, CV, KTP, ijazah, transkrip, dan sertifikat jadi 1 file PDF rapi dengan urutan yang benar dan tanpa watermark.",
        badge: "Alur Berkas Lamaran HRD",
        h1: "Gabung Berkas Lamaran Kerja & CV Jadi Satu PDF",
        lead: "Urutkan surat lamaran, CV, KTP, ijazah, dan sertifikat dalam 1 file PDF siap kirim ke HRD — lengkap dengan putar halaman scan yang miring.",
        specsTitle: "Urutan Berkas Lamaran Kerja Standar HRD",
        specs: [
          { label: "Urutan 1", value: "Surat Lamaran Kerja (Cover Letter)" },
          { label: "Urutan 2", value: "CV / Daftar Riwayat Hidup (1–2 Halaman)" },
          { label: "Urutan 3", value: "Scan KTP / Kartu Identitas" },
          { label: "Urutan 4–5", value: "Ijazah, Transkrip Nilai & Sertifikat Pendukung" },
        ],
        stepsTitle: "Cara Menggabungkan Berkas Lamaran",
        steps: [
          {
            title: "Masukkan semua file PDF",
            desc: "Pilih surat lamaran, CV, ijazah, dan lampiran sekaligus.",
          },
          {
            title: "Atur urutan & putar halaman miring",
            desc: "Geser urutan kartu sesuai daftar HRD dan putar dokumen yang terbalik.",
          },
          {
            title: "Unduh & cek ukuran file",
            desc: "Simpan 1 file PDF utuh; jika > 1 MB, lanjut kompres di preset 500 KB / 1 MB.",
          },
        ],
        tipsTitle: "Etika File Lamaran Agar Cepat Dibuka HRD",
        tips: [
          "Gunakan nama file yang jelas seperti `Lamaran_NamaLengkap_Posisi.pdf`.",
          "Usahakan total ukuran berkas gabungan maksimal 500 KB – 1 MB agar cepat dibuka di HP HRD.",
        ],
        faqs: [
          {
            q: "Bagaimana kalau ada lampiran yang formatnya masih foto JPG?",
            a: "Ubah foto KTP/ijazah ke PDF dulu memakai tool JPG ke PDF, lalu gabungkan semuanya di halaman ini.",
          },
          {
            q: "Apakah halaman ijazah yang miring bisa diluruskan sebelum digabung?",
            a: "Ya, klik tombol putar pada kartu dokumen sebelum menekan gabungkan.",
          },
          {
            q: "Apakah ada watermark Pdfumi di hasilnya?",
            a: "Tidak ada watermark sama sekali.",
          },
        ],
      },
      ja: {
        seoTitle: "応募書類・履歴書・職務経歴書を1つのPDFに結合 | Pdfumi",
        seoDescription:
          "送付状・履歴書・職務経歴書・資格証明書を正しい順番で1つのPDFに結合。傾いたスキャンページの回転やプレビューも無料で対応。",
        badge: "採用応募書類まとめ",
        h1: "履歴書・職務経歴書・証明書を1つのPDFに結合",
        lead: "複数の応募書類をドラッグで並び替え、横向きスキャンを修正して提出用1ファイルにまとめます。",
        specsTitle: "一般的な応募書類の結合順",
        specs: [
          { label: "1ページ目", value: "送付状（添え状）" },
          { label: "次のページ", value: "履歴書" },
          { label: "続いて", value: "職務経歴書・ポートフォリオ" },
          { label: "末尾", value: "資格証明書・卒業証明書等" },
        ],
        stepsTitle: "結合手順",
        steps: [
          {
            title: "全PDFをまとめて追加",
            desc: "履歴書や職歴書など提出したいPDFをアップロードします。",
          },
          {
            title: "順番の並べ替え・回転修正",
            desc: "正しい提出順に並べ替え、向きが違うページを回転します。",
          },
          {
            title: "結合してダウンロード",
            desc: "容量制限がある場合は「500KB圧縮」や「1MB圧縮」で仕上げてください。",
          },
        ],
        tipsTitle: "提出前のチェックポイント",
        tips: [
          "ファイル名は「氏名_履歴書_職務経歴書.pdf」のように分かりやすくすると親切です。",
          "メール送付する場合は1MB〜2MB以内に収めると採用担当者が開けやすくなります。",
        ],
        faqs: [
          {
            q: "スマホで撮った証明書画像も一緒にまとめられますか？",
            a: "先に「JPGをPDFに変換」でPDF化してからここで結合できます。",
          },
          {
            q: "横向きになったスキャンを直せますか？",
            a: "はい、結合前のファイルカード上で90度ずつ回転できます。",
          },
          {
            q: "透かしは入りますか？",
            a: "一切入りません。",
          },
        ],
      },
    },
  },
  {
    slug: "hapus-background-tanda-tangan-word-pdf",
    category: "workflow",
    toolKind: "remove-signature-bg",
    parentToolPath: "/tools/remove-signature-bg",
    parentToolName: {
      en: "Transparent Signature PNG",
      id: "Hapus Background Tanda Tangan",
      ja: "署名背景透過",
    },
    relatedSlugs: ["gabung-pdf-lamaran-kerja", "compress-pdf-200kb", "compress-pdf-500kb"],
    copy: {
      en: {
        seoTitle: "Make Handwritten Signature Transparent PNG for Word & PDF | Pdfumi",
        seoDescription:
          "Convert a paper signature photo into a crisp transparent PNG with pure black or blue ink—no grey paper box inside Word, Google Docs, or PDFs.",
        badge: "Clean Ink Extraction (PNG)",
        h1: "Transparent Signature Maker for Word & PDF",
        lead: "Snap a photo of your pen signature on white paper, erase the grey background, sharpen the ink stroke to pure black or blue, and paste seamlessly into documents.",
        specsTitle: "Transparent Signature Specs",
        specs: [
          { label: "Output Format", value: "32-bit Transparent PNG (Alpha Channel)" },
          { label: "Ink Colors", value: "Original Ink, Pure Black, Official Blue, Stamp Red" },
          { label: "Compatible Apps", value: "Microsoft Word, Google Docs, Excel, Sign PDF" },
          { label: "Privacy", value: "100% browser-only processing" },
        ],
        stepsTitle: "Create a Clean Transparent Signature",
        steps: [
          {
            title: "Upload signature photo",
            desc: "Sign on plain unlined white paper and take a well-lit photo.",
          },
          {
            title: "Adjust threshold & ink color",
            desc: "Remove grey paper shadows and switch ink to crisp Pure Black or Blue.",
          },
          {
            title: "Download PNG or copy directly",
            desc: "Insert into Word (`Behind/In Front of Text`) or drop into Sign PDF.",
          },
        ],
        tipsTitle: "For Crisp, Studio-Clean Pen Strokes",
        tips: [
          "Use a dark black or blue ballpoint/gel pen on blank unlined paper.",
          "In Microsoft Word, set image Wrap Text to 'In Front of Text' so the signature sits cleanly over the dotted line.",
        ],
        faqs: [
          {
            q: "Why does a normal photo leave a grey square on Word?",
            a: "Camera photos of white paper are actually light grey (#DFDFDF), not transparent. Removing the background exports true alpha transparency.",
          },
          {
            q: "Is my signature stored on Pdfumi servers?",
            a: "No! Your handwritten signature never leaves your own browser memory.",
          },
          {
            q: "Can I also sign a PDF directly after exporting?",
            a: "Yes — download the PNG and place it inside our Sign PDF tool in seconds.",
          },
        ],
      },
      id: {
        seoTitle: "Hapus Background Tanda Tangan Jadi PNG Transparan untuk Word & PDF | Pdfumi",
        seoDescription:
          "Ubah foto tanda tangan di kertas menjadi PNG transparan dengan tinta hitam/biru tajam agar tidak meninggalkan kotak abu-abu di Word & PDF.",
        badge: "Tanda Tangan PNG Transparan",
        h1: "Hapus Background Tanda Tangan untuk Word & PDF",
        lead: "Foto tanda tangan Anda di kertas HVS, hilangkan bayangan kertas secara instan, pertajam tinta jadi hitam/biru solid, lalu tempel di Word atau PDF.",
        specsTitle: "Spesifikasi Output Tanda Tangan",
        specs: [
          { label: "Format Hasil", value: "PNG Transparan (Alpha Channel)" },
          { label: "Pilihan Warna Tinta", value: "Hitam Pekat, Biru Formal, Merah Stempel, Asli" },
          { label: "Kompatibel Dengan", value: "MS Word, Google Docs, Excel, Sign PDF Pdfumi" },
          { label: "Keamanan", value: "100% di browser — tanda tangan tidak diupload" },
        ],
        stepsTitle: "Cara Membuat Tanda Tangan Transparan",
        steps: [
          {
            title: "Foto tanda tangan di kertas polos",
            desc: "Gunakan pulpen gelap di kertas putih tanpa garis agar hasil bersih.",
          },
          {
            title: "Atur slider batas warna & tinta",
            desc: "Hilangkan latar kertas abu-abu hingga hanya tersisa goresan tanda tangan tajam.",
          },
          {
            title: "Unduh PNG & tempel di dokumen",
            desc: "Masukkan ke MS Word (set Wrap Text: In Front of Text) atau ke alat Sign PDF.",
          },
        ],
        tipsTitle: "Tips Agar Tanda Tangan Terlihat Seperti Asli",
        tips: [
          "Di Microsoft Word, klik kanan gambar tanda tangan -> Wrap Text -> pilih 'In Front of Text' agar bisa digeser bebas tepat di atas garis nama.",
          "Bisa juga dipakai untuk membersihkan gambar stempel/cap perusahaan agar latar belakangnya tembus pandang.",
        ],
        faqs: [
          {
            q: "Apakah aman memproses foto tanda tangan asli di sini?",
            a: "Aman 100%. Gambar tanda tangan diproses langsung di memori browser perangkat Anda dan tidak pernah dikirim ke server.",
          },
          {
            q: "Bisa sekaligus mengubah warna tinta jadi biru atau hitam pekat?",
            a: "Ya, tersedia pilihan warna tinta Hitam, Biru, Merah, atau pertahankan warna asli.",
          },
          {
            q: "Bagaimana jika ditempel ke dokumen PDF?",
            a: "Anda bisa mengunduh PNG transparannya lalu menempelkannya memakai fitur Sign PDF di Pdfumi.",
          },
        ],
      },
      ja: {
        seoTitle: "手書きサイン・印鑑の背景透過PNG作成（Word・PDF貼付用）| Pdfumi",
        seoDescription:
          "白い紙に書いた手書きサインや印影の写真から背景を綺麗に透過し、Word・Googleドキュメント・PDFへ自然に貼れるPNGに変換します。",
        badge: "背景透過 PNG 出力",
        h1: "Word・PDF用 透過サイン／印鑑メーカー",
        lead: "紙に書いた署名や印影を撮影し、紙のグレー影を取り除いてくっきりした黒・青・赤の透過PNGに仕上げます。",
        specsTitle: "透過PNG仕様",
        specs: [
          { label: "出力形式", value: "32bit 透過PNG" },
          { label: "インク色補正", value: "黒 / 青 / 赤（朱肉風）/ 元色維持" },
          { label: "対応ソフト", value: "Word・Excel・Googleドキュメント・Sign PDF" },
          { label: "安全性", value: "完全ブラウザ内処理（画像送信なし）" },
        ],
        stepsTitle: "透過サインの作り方",
        steps: [
          {
            title: "紙のサイン写真を読み込む",
            desc: "無地の白い紙に濃いペンで書いた写真をアップロードします。",
          },
          {
            title: "しきい値とインク色を調整",
            desc: "紙の地色が消えて線だけが残るようスライダーを調整します。",
          },
          {
            title: "PNGを保存して文書へ貼付",
            desc: "Wordでは文字列の折り返しを「前面」にすると罫線の上に綺麗に配置できます。",
          },
        ],
        tipsTitle: "綺麗に透過するコツ",
        tips: [
          "明るい場所で影が入らないように撮影すると境界がより滑らかになります。",
          "朱色の印鑑をスキャンした画像の背景透過にもそのまま活用できます。",
        ],
        faqs: [
          {
            q: "自筆サインがサーバーに保存される心配はありませんか？",
            a: "ありません。画像処理は100%お使いのブラウザ内で行われるため、サイン画像が外部へ送られることはありません。",
          },
          {
            q: "ペンの色を真っ黒や青に変更できますか？",
            a: "はい、ワンクリックで黒・青・赤へ色調補正できます。",
          },
          {
            q: "そのままPDFに貼り付けられますか？",
            a: "PNGをダウンロードした後、Pdfumiの「Sign PDF（PDF署名）」で簡単に配置できます。",
          },
        ],
      },
    },
  },
];

export const SEO_PRESETS_BY_SLUG: Record<string, SeoPreset> = Object.fromEntries(
  SEO_PRESETS.map((p) => [p.slug, p]),
);

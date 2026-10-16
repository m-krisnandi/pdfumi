"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { addHeaderFooterPdf } from "@/lib/pdfLibUtils";
import { PdfPreview, formatFileSize } from "@/components/PdfPreview";
import { Download, Heading, FileText, CheckCircle2 } from "lucide-react";

export function HeaderFooterPdfBoard() {
  const t = useTranslations("headerFooterPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [headerLeft, setHeaderLeft] = useState("");
  const [headerCenter, setHeaderCenter] = useState("");
  const [headerRight, setHeaderRight] = useState("");
  const [footerLeft, setFooterLeft] = useState("");
  const [footerCenter, setFooterCenter] = useState("Halaman {page} dari {total}");
  const [footerRight, setFooterRight] = useState("");
  const [fontSize, setFontSize] = useState(9);

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const blob = await addHeaderFooterPdf(file, {
        headerLeft,
        headerCenter,
        headerRight,
        footerLeft,
        footerCenter,
        footerRight,
        fontSize,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-header-footer.pdf");
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan header & footer");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          labels={{
            choose: t("chooseFile"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={(list) => {
            const f = list?.[0];
            if (f) {
              setFile(f);
              setDone(false);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <div className="min-w-0">
              <p className="truncate text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setDone(false);
              }}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              {tCommon("remove")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl glass-panel p-5 border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    <Heading className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Penomoran & Teks Kustom
                    </h4>
                    <p className="text-[11px] text-zinc-500">Header & Footer tiap halaman</p>
                  </div>
                </div>

                {/* Header section */}
                <div className="space-y-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-3.5 border border-zinc-200/70 dark:border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                    Header (Bagian Atas Dokumen)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Kiri</span>
                      <input
                        type="text"
                        value={headerLeft}
                        onChange={(e) => setHeaderLeft(e.target.value)}
                        placeholder="Judul Dokumen"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Tengah</span>
                      <input
                        type="text"
                        value={headerCenter}
                        onChange={(e) => setHeaderCenter(e.target.value)}
                        placeholder="Nama Instansi"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Kanan</span>
                      <input
                        type="text"
                        value={headerRight}
                        onChange={(e) => setHeaderRight(e.target.value)}
                        placeholder="Rahasia / Tanggal"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer section */}
                <div className="space-y-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-3.5 border border-zinc-200/70 dark:border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                    Footer (Bagian Bawah Dokumen)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Kiri</span>
                      <input
                        type="text"
                        value={footerLeft}
                        onChange={(e) => setFooterLeft(e.target.value)}
                        placeholder="Hak Cipta / Catatan"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Tengah (Nomor)</span>
                      <input
                        type="text"
                        value={footerCenter}
                        onChange={(e) => setFooterCenter(e.target.value)}
                        placeholder="Halaman {page} dari {total}"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Kanan</span>
                      <input
                        type="text"
                        value={footerRight}
                        onChange={(e) => setFooterRight(e.target.value)}
                        placeholder="Kode Berkas"
                        className="w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500">
                  Tips: Gunakan token <code>{`{page}`}</code> untuk nomor halaman aktif dan{" "}
                  <code>{`{total}`}</code> untuk total seluruh halaman.
                </div>

                <ErrorBanner message={error} />

                {done && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                    <span>Header & Footer berhasil diterapkan dan diunduh!</span>
                  </div>
                )}

                <Button
                  type="button"
                  loading={processing}
                  onClick={handleApply}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Terapkan Header/Footer & Unduh</span>
                </Button>
              </div>
            </div>

            {/* Right Live Document Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl glass-panel p-4 border border-zinc-200/80 dark:border-white/10 space-y-3 shadow-sm">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      Pratinjau Dokumen
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-500">Live PDF Viewer</span>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 dark:border-white/5 bg-zinc-100/70 dark:bg-zinc-950/50 p-3 max-h-[560px] overflow-y-auto">
                  <PdfPreview file={file} title={file.name} className="min-h-[22rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

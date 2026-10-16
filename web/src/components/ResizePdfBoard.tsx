"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { resizePdfPages, PAGE_SIZES } from "@/lib/pdfLibUtils";
import { PdfPreview, formatFileSize } from "@/components/PdfPreview";
import { FileSliders, Download, FileText, CheckCircle2 } from "lucide-react";

export function ResizePdfBoard() {
  const t = useTranslations("resizePdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<keyof typeof PAGE_SIZES>("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResize() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const blob = await resizePdfPages(file, targetSize, orientation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, `-${targetSize.toLowerCase()}.pdf`);
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah ukuran halaman");
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
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl glass-panel p-5 border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    <FileSliders className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Pengaturan Dimensi Kertas
                    </h4>
                    <p className="text-[11px] text-zinc-500">Pilih format cetak tujuan</p>
                  </div>
                </div>

                {/* Configuration Options */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block mb-2">
                      Pilih Ukuran Kertas
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.keys(PAGE_SIZES).map((sizeKey) => (
                        <button
                          key={sizeKey}
                          type="button"
                          onClick={() => setTargetSize(sizeKey as keyof typeof PAGE_SIZES)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            targetSize === sizeKey
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-xs font-bold"
                              : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          <div className="text-sm">{sizeKey}</div>
                          <div className="text-[9px] text-zinc-400">
                            {sizeKey === "A4" && "210 × 297 mm"}
                            {sizeKey === "Letter" && "8.5 × 11 in"}
                            {sizeKey === "Legal" && "8.5 × 14 in"}
                            {sizeKey === "A3" && "297 × 420 mm"}
                            {sizeKey === "A5" && "148 × 210 mm"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block mb-2">
                      Orientasi Halaman
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrientation("portrait")}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                          orientation === "portrait"
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Tegak (Portrait)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation("landscape")}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                          orientation === "landscape"
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Mendatar (Landscape)
                      </button>
                    </div>
                  </div>
                </div>

                <ErrorBanner message={error} />

                {done && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                    <span>Ukuran kertas berhasil disesuaikan dan diunduh!</span>
                  </div>
                )}

                <Button
                  type="button"
                  loading={processing}
                  onClick={handleResize}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Sesuaikan Ukuran Kertas & Unduh</span>
                </Button>
              </div>
            </div>

            {/* Right Live Document Preview */}
            <div className="lg:col-span-7">
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

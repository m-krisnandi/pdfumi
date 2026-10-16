"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { formatFileSize } from "@/components/PdfPreview";
import { compressPdfQualityFirst } from "@/lib/pdfLibUtils";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

export function CompressPdfBoard() {
  const t = useTranslations("compressPdf");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setResultSize(null);
    setError(null);
  }

  async function onDownload() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    setDownloading(true);
    setProgressStatus("Menyiapkan dokumen...");
    setError(null);

    try {
      const compressedBlob = await compressPdfQualityFirst(file, (msg) => {
        setProgressStatus(msg);
      });
      setResultSize(compressedBlob.size);

      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-compressed.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setProgressStatus(null);
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={takeFiles}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-4">
            <PdfDocumentThumb file={file} className="h-44 w-32 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-base font-semibold text-zinc-900 dark:text-white">{file.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Ukuran Asli:</span>
                <span className="rounded-lg bg-zinc-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResultSize(null);
                }}
                className="text-xs text-zinc-400 hover:text-red-600 transition underline cursor-pointer"
              >
                {tCommon("remove")}
              </button>
            </div>
          </div>

          {/* Smallpdf-style Quality-first Compression Card */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Kompresi Dasar (Kualitas Terbaik)
                  </span>
                  <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    Optimal
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Mengurangi ukuran berkas 50%–70% dengan kualitas teks & gambar tetap jernih dan tajam seperti dokumen asli.
                </p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-teal-600 text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Teks tajam 100% terbaca</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Hemat ukuran 50%–70%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Bebas tanda air (watermark)</span>
              </div>
            </div>
          </div>

          {resultSize && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Berhasil dikompres menjadi <strong>{formatFileSize(resultSize)}</strong> (
                {Math.round((1 - resultSize / file.size) * 100)}% lebih hemat) dengan kualitas tetap tajam!
              </span>
            </div>
          )}

          <ErrorBanner message={error} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading} className="w-full sm:w-auto">
              {downloading ? (progressStatus || tCommon("processing")) : "Kompres & Unduh PDF"}
            </Button>
            {downloading && progressStatus && (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium animate-pulse">
                {progressStatus}
              </span>
            )}
          </div>
        </div>
      )}
      {!file ? <ErrorBanner message={error} /> : null}
    </ToolShell>
  );
}

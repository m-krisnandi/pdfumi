"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { formatFileSize } from "@/components/PdfPreview";
import { compressPdfToTargetKb } from "@/lib/pdfLibUtils";
import { CheckCircle2, Sparkles, Target } from "lucide-react";

export function CompressPdfBoard() {
  const t = useTranslations("compressPdf");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Target preset: "auto" | "200kb" | "500kb" | "1mb" | "custom"
  const [targetPreset, setTargetPreset] = useState<"auto" | "200kb" | "500kb" | "1mb" | "custom">("200kb");
  const [customKb, setCustomKb] = useState(180);
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
    setProgressStatus(null);
    setError(null);

    try {
      if (targetPreset === "auto") {
        // Standard server compression
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${API_BASE}/api/v1/pdf/compress`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(file, "document-compressed.pdf", "pdf"));
      } else {
        // Target-driven compression
        let targetLimitKb = 200;
        if (targetPreset === "200kb") targetLimitKb = 200;
        else if (targetPreset === "500kb") targetLimitKb = 500;
        else if (targetPreset === "1mb") targetLimitKb = 1000;
        else if (targetPreset === "custom") targetLimitKb = Math.max(50, customKb);

        setProgressStatus("Menganalisis dokumen...");
        // Run smart iterative downsampling to strictly guarantee fitting under target KB
        const compressedBlob = await compressPdfToTargetKb(file, targetLimitKb, (msg) => {
          setProgressStatus(msg);
        });
        setResultSize(compressedBlob.size);

        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(/\.pdf$/i, `-compressed-${targetLimitKb}kb.pdf`);
        a.click();
        URL.revokeObjectURL(url);
      }
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

          {/* Target Compression Selector */}
          <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Pilih Target Ukuran File (Kompres Khusus)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTargetPreset("200kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "200kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "200kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "200kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 200 KB</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Paling pas untuk CPNS, SSCASN, BUMN & Bank</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("500kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "500kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "500kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "500kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 500 KB</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Standar lamaran kerja & lampiran email</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("1mb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "1mb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "1mb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "1mb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 1 MB</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Keseimbangan rasio kualitas & ukuran</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("auto")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "auto"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "auto" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "auto" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Otomatis (Optimal)</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Kompresi cerdas menjaga ketajaman teks</div>
                </div>
              </button>
            </div>

            {targetPreset === "custom" && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Target KB:</span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={customKb}
                  onChange={(e) => setCustomKb(Number(e.target.value))}
                  className="w-24 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                />
                <span className="text-xs text-zinc-500">KB</span>
              </div>
            )}
          </div>

          {resultSize && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Berhasil dikompres menjadi <strong>{formatFileSize(resultSize)}</strong> (
                {Math.round((1 - resultSize / file.size) * 100)}% lebih hemat)!
              </span>
            </div>
          )}

          <ErrorBanner message={error} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading} className="w-full sm:w-auto">
              {downloading ? (progressStatus || tCommon("processing")) : "Kompres & Unduh PDF"}
            </Button>
            {downloading && progressStatus && (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
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

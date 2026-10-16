"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { removeMetadataPdf, readPdfMetadata, type PdfMetadataInfo } from "@/lib/pdfLibUtils";
import { PdfPreview, formatFileSize } from "@/components/PdfPreview";
import {
  Eraser,
  Download,
  ShieldCheck,
  FileText,
  User,
  Cpu,
  Calendar,
  Tag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function RemoveMetadataPdfBoard() {
  const t = useTranslations("removeMetadataPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadataInfo | null>(null);
  const [readingMeta, setReadingMeta] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cleanDone, setCleanDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setMetadata(null);
      setCleanDone(false);
      return;
    }

    let active = true;
    setReadingMeta(true);
    setCleanDone(false);
    setError(null);

    readPdfMetadata(file)
      .then((meta) => {
        if (active) {
          setMetadata(meta);
          setReadingMeta(false);
        }
      })
      .catch(() => {
        if (active) setReadingMeta(false);
      });

    return () => {
      active = false;
    };
  }, [file]);

  async function handleClean() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const blob = await removeMetadataPdf(file);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-clean.pdf");
      a.click();
      URL.revokeObjectURL(url);
      setCleanDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membersihkan metadata");
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
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* File Header */}
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
                setMetadata(null);
                setCleanDone(false);
              }}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              {tCommon("remove")}
            </button>
          </div>

          {/* 2-Column Responsive Layout: Left = Metadata Inspector & Actions, Right = Live Document Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Metadata Inspector */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl glass-panel p-5 border border-zinc-200/80 dark:border-white/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        Metadata Dokumen
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Informasi tersembunyi yang terdeteksi
                      </p>
                    </div>
                  </div>
                  {readingMeta && (
                    <span className="text-[10px] text-teal-600 animate-pulse font-medium">
                      Memeriksa...
                    </span>
                  )}
                </div>

                {/* Detected Fields Table */}
                <div className="space-y-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-3.5 border border-zinc-200/70 dark:border-white/5 text-xs">
                  <div className="flex items-start justify-between py-1 border-b border-zinc-200/40 dark:border-white/5 gap-2">
                    <span className="text-zinc-500 flex items-center gap-1.5 shrink-0">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Penulis (Author):
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate">
                      {metadata?.author || <em className="text-zinc-400 font-normal">Tidak ada</em>}
                    </span>
                  </div>

                  <div className="flex items-start justify-between py-1 border-b border-zinc-200/40 dark:border-white/5 gap-2">
                    <span className="text-zinc-500 flex items-center gap-1.5 shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                      Software (Creator):
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate max-w-[180px]">
                      {metadata?.creator || metadata?.producer || (
                        <em className="text-zinc-400 font-normal">Tidak ada</em>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start justify-between py-1 border-b border-zinc-200/40 dark:border-white/5 gap-2">
                    <span className="text-zinc-500 flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      Waktu Dibuat:
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate">
                      {metadata?.creationDate ? (
                        new Date(metadata.creationDate).toLocaleDateString()
                      ) : (
                        <em className="text-zinc-400 font-normal">Tidak ada</em>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start justify-between py-1 gap-2">
                    <span className="text-zinc-500 flex items-center gap-1.5 shrink-0">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      Kata Kunci:
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate max-w-[180px]">
                      {metadata?.keywords ? (
                        metadata.keywords
                      ) : (
                        <em className="text-zinc-400 font-normal">Tidak ada</em>
                      )}
                    </span>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="rounded-2xl bg-teal-500/10 border border-teal-500/20 p-3 text-[11px] text-teal-800 dark:text-teal-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Pembersihan Privasi Total
                  </p>
                  <p className="leading-relaxed opacity-90">
                    Seluruh identitas nama penulis, aplikasi software, dan stempel waktu revisi akan
                    dihapus permanen tanpa merusak tata letak maupun teks dokumen.
                  </p>
                </div>

                <ErrorBanner message={error} />

                {cleanDone && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                    <span>PDF bersih telah berhasil diunduh tanpa jejak metadata!</span>
                  </div>
                )}

                <Button
                  type="button"
                  loading={processing}
                  onClick={handleClean}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Hapus Metadata & Unduh PDF Bersih</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Live PDF Preview */}
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

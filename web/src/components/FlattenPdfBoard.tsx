"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { flattenPdf } from "@/lib/pdfLibUtils";
import { PdfPreview, formatFileSize } from "@/components/PdfPreview";
import { Layers, Download, CheckCircle2, FileText, Lock } from "lucide-react";

export function FlattenPdfBoard() {
  const t = useTranslations("flattenPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFlatten() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const blob = await flattenPdf(file);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-flattened.pdf");
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal meratakan dokumen PDF");
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
                    <Layers className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Ratakan Seluruh Lapisan
                    </h4>
                    <p className="text-[11px] text-zinc-500">Kunci elemen interaktif</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-3.5 border border-zinc-200/70 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                  <p className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    Manfaat Fitur Flatten:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Kunci formulir isian (form fields) agar tidak dapat diedit lagi.</li>
                    <li>Ratakan tanda tangan & stempel menjadi bagian permanen halaman.</li>
                    <li>Cegah perubahan tata letak saat dibuka di printer atau software lain.</li>
                  </ul>
                </div>

                <ErrorBanner message={error} />

                {done && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                    <span>Dokumen PDF berhasil diratakan dan diunduh!</span>
                  </div>
                )}

                <Button
                  type="button"
                  loading={processing}
                  onClick={handleFlatten}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Ratakan Dokumen (Flatten) & Unduh</span>
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

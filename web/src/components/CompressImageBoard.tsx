"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/components/PdfPreview";
import { Target, Sparkles, Download, CheckCircle2 } from "lucide-react";

export function CompressImageBoard({
  namespace = "compressImage",
  forcedFormat,
  accept = "image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif",
}: {
  namespace?: string;
  forcedFormat?: "jpeg" | "png" | "webp";
  accept?: string;
}) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [targetPreset, setTargetPreset] = useState<"100kb" | "200kb" | "300kb" | "500kb" | "custom">("200kb");
  const [customKb, setCustomKb] = useState(150);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!compressedBlob) {
      setCompressedUrl(null);
      return;
    }
    const url = URL.createObjectURL(compressedBlob);
    setCompressedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [compressedBlob]);

  async function handleCompress() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setCompressedBlob(null);

    let targetLimitKb = 200;
    if (targetPreset === "100kb") targetLimitKb = 100;
    else if (targetPreset === "200kb") targetLimitKb = 200;
    else if (targetPreset === "300kb") targetLimitKb = 300;
    else if (targetPreset === "500kb") targetLimitKb = 500;
    else if (targetPreset === "custom") targetLimitKb = Math.max(30, customKb);

    const targetBytes = targetLimitKb * 1024;

    try {
      const srcUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal membaca gambar"));
        img.src = srcUrl;
      });
      URL.revokeObjectURL(srcUrl);

      const canvas = document.createElement("canvas");
      let currentW = img.width;
      let currentH = img.height;

      // Determine output mime
      let mimeType = "image/jpeg";
      if (forcedFormat === "png") mimeType = "image/png";
      else if (forcedFormat === "webp") mimeType = "image/webp";
      else if (!forcedFormat && file.type === "image/png") mimeType = "image/png";
      else if (!forcedFormat && file.type === "image/webp") mimeType = "image/webp";

      let bestBlob: Blob | null = null;
      let quality = 0.92;
      let step = 0;

      while (step < 12) {
        step++;
        canvas.width = currentW;
        canvas.height = currentH;
        const ctx = canvas.getContext("2d");
        if (!ctx) break;

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, currentW, currentH);
        } else {
          ctx.clearRect(0, 0, currentW, currentH);
        }
        ctx.drawImage(img, 0, 0, currentW, currentH);

        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), mimeType, quality)
        );

        if (!blob) break;

        if (blob.size <= targetBytes) {
          bestBlob = blob;
          break;
        }

        if (mimeType === "image/png") {
          currentW = Math.round(currentW * 0.85);
          currentH = Math.round(currentH * 0.85);
        } else {
          if (quality > 0.45) {
            quality -= 0.12;
          } else {
            currentW = Math.round(currentW * 0.85);
            currentH = Math.round(currentH * 0.85);
            quality = 0.75;
          }
        }
      }

      if (!bestBlob) {
        bestBlob = await new Promise((res) =>
          canvas.toBlob((b) => res(b), mimeType, 0.4)
        );
      }

      if (bestBlob) {
        setCompressedBlob(bestBlob);
      } else {
        throw new Error("Gagal mengompres gambar ke target");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat kompresi");
    } finally {
      setProcessing(false);
    }
  }

  function downloadResult() {
    if (!compressedBlob || !file) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(compressedBlob);
    let ext = "jpg";
    if (forcedFormat === "png" || compressedBlob.type === "image/png") ext = "png";
    else if (forcedFormat === "webp" || compressedBlob.type === "image/webp") ext = "webp";
    a.download = file.name.replace(/\.[^/.]+$/, "") + `-compressed.${ext}`;
    a.click();
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          accept={accept}
          labels={{
            choose: t("chooseFile"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={(list) => {
            const f = list?.[0];
            if (f && (f.type.startsWith("image/") || /\.(heic|heif|webp|png|jpg|jpeg|gif)$/i.test(f.name))) {
              setFile(f);
              setCompressedBlob(null);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-zinc-500">Ukuran Asli: {formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setCompressedBlob(null);
              }}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              {tCommon("remove")}
            </button>
          </div>

          {/* Preset Selector */}
          <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Pilih Target Ukuran Gambar (KB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetPreset("100kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "100kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "100kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "100kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 100 KB</div>
                  <div className="text-[11px] text-zinc-500">Batas ketat formulir kedinasan & instansi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("200kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "200kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "200kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "200kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 200 KB</div>
                  <div className="text-[11px] text-zinc-500">Standar resmi SSCASN BKN CPNS & PPPK</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("300kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "300kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "300kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "300kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 300 KB</div>
                  <div className="text-[11px] text-zinc-500">Portal universitas & beasiswa LPDP</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPreset("500kb")}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                  targetPreset === "500kb"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-xs"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${targetPreset === "500kb" ? "border-teal-600 bg-teal-600 text-white" : "border-zinc-400"}`}>
                  {targetPreset === "500kb" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Di Bawah 500 KB</div>
                  <div className="text-[11px] text-zinc-500">Email & web upload umum</div>
                </div>
              </button>
            </div>

            {targetPreset === "custom" && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Target Kustom:</span>
                <input
                  type="number"
                  min={20}
                  max={2000}
                  value={customKb}
                  onChange={(e) => setCustomKb(Number(e.target.value))}
                  className="w-24 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs"
                />
                <span className="text-xs text-zinc-500">KB</span>
              </div>
            )}
          </div>

          {compressedBlob && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  Selesai! Ukuran gambar berhasil ditekan menjadi {formatFileSize(compressedBlob.size)} (
                  {Math.round((1 - compressedBlob.size / file.size) * 100)}% lebih hemat)
                </span>
              </div>
              {compressedUrl && (
                <div className="flex justify-center pt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={compressedUrl}
                    alt="Hasil kompres"
                    className="max-h-56 rounded-xl shadow border border-white/20"
                  />
                </div>
              )}
            </div>
          )}

          <ErrorBanner message={error} />

          <div className="flex flex-wrap gap-3">
            {!compressedBlob ? (
              <Button
                type="button"
                loading={processing}
                onClick={handleCompress}
                className="w-full sm:w-auto"
              >
                Kompres Gambar Sekarang
              </Button>
            ) : (
              <Button
                type="button"
                onClick={downloadResult}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Unduh Gambar Hasil Kompres
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

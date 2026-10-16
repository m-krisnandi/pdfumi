"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/components/PdfPreview";
import { Sparkles, Download, CheckCircle2, ShieldCheck, ImageIcon } from "lucide-react";

export function CompressImageBoard({
  namespace = "compressImage",  forcedFormat,
  accept = "image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif",
}: {  namespace?: string;  forcedFormat?: "jpeg" | "png" | "webp";
  accept?: string;}) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      setFileDimensions(null);
      setCompressedBlob(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setFileDimensions({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

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

    try {
      const srcUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal membaca format gambar"));
        img.src = srcUrl;
      });
      URL.revokeObjectURL(srcUrl);

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // Downscale if photo resolution is excessively high (> 2048px on max edge)
      const maxDim = 2048;
      let targetW = origW;
      let targetH = origH;
      if (Math.max(origW, origH) > maxDim) {
        const ratio = maxDim / Math.max(origW, origH);
        targetW = Math.round(origW * ratio);
        targetH = Math.round(origH * ratio);
      }

      // Determine output mime
      let mimeType = "image/jpeg";
      if (forcedFormat === "png") mimeType = "image/png";
      else if (forcedFormat === "webp") mimeType = "image/webp";
      else if (!forcedFormat && file.type === "image/png") mimeType = "image/png";
      else if (!forcedFormat && file.type === "image/webp") mimeType = "image/webp";

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Gagal menginisialisasi canvas pemrosesan");

      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Quality-first compression: quality 0.80 provides crisp visual clarity with 50-80% size reduction
      const quality = 0.80;
      let blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), mimeType, quality)
      );

      // Absolute guarantee: Never return an image file larger than the original
      let bestBlob = blob;
      if (!bestBlob || bestBlob.size >= file.size) {
        bestBlob = file;
      }

      setCompressedBlob(bestBlob);

      // Trigger automatic download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(bestBlob);
      let ext = "jpg";
      if (forcedFormat === "png" || bestBlob.type === "image/png") ext = "png";      else if (forcedFormat === "webp" || bestBlob.type === "image/webp") ext = "webp";
      a.download = file.name.replace(/\.[^/.]+$/, "") + `-compressed.${ext}`;
      a.click();
    } catch (err) {      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses gambar");
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
          {/* Image Thumbnail & Metadata Header */}
          <div className="flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center p-1.5 shadow-xs">
              {filePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={filePreviewUrl}
                  alt={file.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-400" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2 py-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-base font-semibold text-zinc-900 dark:text-white">
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setCompressedBlob(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-red-600 transition underline cursor-pointer shrink-0"
                >
                  {tCommon("remove")}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Ukuran Asli:</span>
                  <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-2 py-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {fileDimensions && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">Resolusi:</span>
                    <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {fileDimensions.width} × {fileDimensions.height} px
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Format berkas: <strong className="uppercase text-zinc-700 dark:text-zinc-300">{file.name.split(".").pop() || "IMG"}</strong>
              </p>
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
                  Mengurangi ukuran berkas 50%–80% dengan ketajaman gambar dan warna tetap jernih seperti aslinya.
                </p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-teal-600 text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Visual jernih & tajam</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Hemat ukuran 50%–80%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Bebas tanda air (watermark)</span>
              </div>
            </div>
          </div>

          {/* Compression Result Banner & Preview */}
          {compressedBlob && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {compressedBlob.size < file.size ? (
                    <>
                      Berhasil dikompres menjadi <strong>{formatFileSize(compressedBlob.size)}</strong> (
                      {Math.max(1, Math.round((1 - compressedBlob.size / file.size) * 100))}% lebih hemat) dengan kualitas tetap tajam!
                    </>
                  ) : (
                    <>
                      Gambar ini sudah dalam ukuran paling optimal (<strong>{formatFileSize(compressedBlob.size)}</strong>).
                    </>
                  )}
                </span>
              </div>

              {compressedUrl && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                    Preview Hasil Kompresi:
                  </span>
                  <div className="flex justify-center p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-zinc-200/60 dark:border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={compressedUrl}
                      alt="Hasil kompres"
                      className="max-h-64 max-w-full rounded-lg shadow-sm object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <ErrorBanner message={error} />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              loading={processing}
              onClick={handleCompress}
              className="w-full sm:w-auto"
            >
              {processing ? "Mengompres Gambar..." : compressedBlob ? "Kompres Ulang & Unduh" : "Kompres & Unduh Gambar"}
            </Button>

            {compressedBlob && (
              <button
                type="button"
                onClick={downloadResult}
                className="cursor-pointer rounded-full bg-zinc-800 dark:bg-white/10 hover:bg-zinc-700 dark:hover:bg-white/20 text-white px-5 py-3 text-sm font-medium transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <Download className="w-4 h-4" /> Unduh Hasil Gambar
              </button>
            )}
          </div>
        </div>
      )}
      {!file ? <ErrorBanner message={error} /> : null}
    </ToolShell>
  );
}

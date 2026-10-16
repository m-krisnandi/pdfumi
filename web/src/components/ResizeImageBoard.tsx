"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/components/PdfPreview";
import { Lock, Unlock, Download, Scaling } from "lucide-react";

export function ResizeImageBoard() {
  const t = useTranslations("resizeImage");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [quality, setQuality] = useState(90);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setOrigW(0);
      setOrigH(0);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOrigW(img.width);
      setOrigH(img.height);
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function handleWidthChange(newW: number) {
    setWidth(newW);
    if (lockRatio && origW > 0) {
      setHeight(Math.round((newW / origW) * origH));
    }
  }

  function handleHeightChange(newH: number) {
    setHeight(newH);
    if (lockRatio && origH > 0) {
      setWidth(Math.round((newH / origH) * origW));
    }
  }

  function setScalePercent(pct: number) {
    if (origW > 0 && origH > 0) {
      const w = Math.round((origW * pct) / 100);
      const h = Math.round((origH * pct) / 100);
      setWidth(w);
      setHeight(h);
    }
  }

  async function handleResize() {
    if (!file || !previewUrl) return;
    setProcessing(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gagal membaca gambar"));
        img.src = previewUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tidak tersedia");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mimeType = `image/${format}`;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Gagal memproses pengubahan ukuran");
            setProcessing(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const ext = format === "jpeg" ? "jpg" : format;
          a.download = file.name.replace(/\.[^/.]+$/, "") + `-resized-${width}x${height}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          setProcessing(false);
        },
        mimeType,
        quality / 100
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses");
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          accept="image/*"
          labels={{
            choose: t("chooseFile"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={(list) => {
            const f = list?.[0];
            if (f && f.type.startsWith("image/")) {
              setFile(f);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-zinc-500">
                Dimensi Asli: {origW} × {origH} px ({formatFileSize(file.size)})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs text-red-500 hover:underline"
            >
              {tCommon("remove")}
            </button>
          </div>

          {/* Controls */}
          <div className="space-y-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-white/10">
            {/* Quick Percent Presets */}
            <div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Preset Skala Cepat:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setScalePercent(pct)}
                    className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold hover:border-teal-500 hover:text-teal-600 transition"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Lebar (px):
                <input
                  type="number"
                  min={10}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="mt-1 block w-28 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                />
              </label>

              <button
                type="button"
                onClick={() => setLockRatio((v) => !v)}
                className={`mt-4 p-2 rounded-xl border transition ${
                  lockRatio
                    ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600"
                    : "border-zinc-300 dark:border-white/20 text-zinc-400"
                }`}
                title={lockRatio ? "Kunci rasio aktif" : "Kunci rasio nonaktif"}
              >
                {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tinggi (px):
                <input
                  type="number"
                  min={10}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="mt-1 block w-28 rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                />
              </label>

              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Format:
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as "jpeg" | "png" | "webp")}
                  className="mt-1 block rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="jpeg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
            </div>
          </div>

          {/* Preview Image */}
          {previewUrl && (
            <div className="flex justify-center p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/50">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 rounded-xl object-contain shadow"
              />
            </div>
          )}

          <ErrorBanner message={error} />

          <Button
            type="button"
            loading={processing}
            onClick={handleResize}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Ubah Ukuran & Unduh</span>
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

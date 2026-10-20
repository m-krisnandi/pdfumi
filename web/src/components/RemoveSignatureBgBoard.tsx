"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { Sparkles, Download, Copy, Check, SlidersHorizontal } from "lucide-react";

export function RemoveSignatureBgBoard() {
  const t = useTranslations("removeSignatureBg");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(200); // 0-255 threshold
  const [inkColor, setInkColor] = useState<"keep" | "black" | "blue" | "red">("black");
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [contrast, setContrast] = useState(1.3);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (!file) {
      setHasRendered(false);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > threshold) {
          // Paper background -> pure transparent
          d[i + 3] = 0;
        } else {
          // Ink stroke
          // Alpha based on darkness for anti-aliased smooth edges
          const alphaFactor = Math.min(1, Math.max(0, (threshold - lum) / (threshold * 0.4)));
          d[i + 3] = Math.round(alphaFactor * 255);

          if (inkColor === "black") {
            d[i] = 18;
            d[i + 1] = 24;
            d[i + 2] = 38;
          } else if (inkColor === "blue") {
            d[i] = 26;
            d[i + 1] = 68;
            d[i + 2] = 168;
          } else if (inkColor === "red") {
            d[i] = 220;
            d[i + 1] = 38;
            d[i + 2] = 38;
          }
          // if inkColor === "keep", leave r,g,b untouched
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setHasRendered(true);
    };

    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file, threshold, inkColor, contrast]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tanda-tangan-transparan.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError("Peramban tidak mengizinkan salin ke papan klip");
      }
    }, "image/png");
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
            <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-xs">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              {tCommon("remove")}
            </button>
          </div>

          {/* Controls Bar */}
          <div className="space-y-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-white/10">
            {/* Ink Color Selector */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Pilihan Warna Tinta Tanda Tangan:
              </span>
              <div className="flex flex-wrap gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setInkColor("black")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    inkColor === "black"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-zinc-900 inline-block" />
                  <span>Hitam Formal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInkColor("blue")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    inkColor === "blue"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-700 inline-block" />
                  <span>Biru Resmi (Pulpen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInkColor("red")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    inkColor === "red"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block" />
                  <span>Merah Segel (Hankō)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInkColor("keep")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    inkColor === "keep"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                      : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block" />
                  <span>Pertahankan Warna Asli</span>
                </button>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sensitivitas Hapus Background (Threshold):</span>
                </span>
                <span className="font-bold text-teal-600">{threshold}</span>
              </div>
              <input
                type="range"
                min={120}
                max={245}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Lebih Tebal (simpan bayangan)</span>
                <span>Lebih Bersih (kertas abu-abu hilang)</span>
              </div>
            </div>
          </div>

          {/* Checkerboard Transparent Preview Canvas */}
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,#111827_0%_50%)] [background-size:24px_24px] border border-zinc-200 dark:border-white/10 min-h-64 shadow-inner">
            <canvas
              ref={canvasRef}
              className="max-h-64 max-w-full object-contain filter drop-shadow-md"
            />
          </div>

          <ErrorBanner message={error} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG Transparan</span>
            </Button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-full border border-zinc-300 dark:border-white/20 bg-white/70 dark:bg-white/10 px-5 py-3 text-sm font-semibold hover:border-teal-500 hover:text-teal-600 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Tersalin ke Clipboard!" : "Salin Gambar"}</span>
            </button>

            <Link
              href={`/${locale}/tools/sign-pdf`}
              className="flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-5 py-3 text-sm font-semibold hover:bg-teal-100 transition"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Tempel ke Dokumen PDF</span>
            </Link>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

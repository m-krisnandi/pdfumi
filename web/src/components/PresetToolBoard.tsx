"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, friendlyError, responseToBlob } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { formatFileSize } from "@/components/PdfPreview";
import { PasFotoBoard } from "@/components/PasFotoBoard";
import { ResizeImageBoard } from "@/components/ResizeImageBoard";
import { MergePdfBoard } from "@/components/MergePdfBoard";
import { RemoveSignatureBgBoard } from "@/components/RemoveSignatureBgBoard";
import { Link } from "@/i18n/navigation";
import { PresetLocale, PresetToolKind } from "@/lib/seo-presets";
import { CheckCircle2, AlertTriangle, Download, Sparkles, ArrowRight } from "lucide-react";

type UILabels = {
  origLabel: string;
  targetLabel: string;
  outputLabel: string;
  passBadge: (targetKb: number) => string;
  overBadge: (targetKb: number) => string;
  overHint: string;
  compressPdfBtn: string;
  compressImgBtn: string;
  processing: string;
  downloadBtn: string;
  remove: string;
  imgDropChoose: string;
  imgDropHint: string;
  imgUploadHint: string;
  imgReadError: string;
  altScanFlow: string;
};

const UI_BY_LOCALE: Record<PresetLocale, UILabels> = {
  id: {
    origLabel: "Ukuran Asli",
    targetLabel: "Batas Target",
    outputLabel: "Hasil Kompresi",
    passBadge: (kb) => `Memenuhi batas <= ${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}`,
    overBadge: (kb) => `Hasil masih di atas batas ${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`} (scan gambar besar)`,
    overHint:
      "File PDF ini kemungkinan berisi gambar scan resolusi kamera penuh. Untuk menurunkannya di bawah batas, konversi ke JPG lalu kompres gambar ke target KB sebelum dijadikan PDF lagi:",
    compressPdfBtn: "Kompres & Verifikasi Ukuran PDF",
    compressImgBtn: "Kompres Otomatis Di Bawah Target",
    processing: "Mengoptimalkan ukuran file...",
    downloadBtn: "Unduh Hasil",
    remove: "Ganti file",
    imgDropChoose: "Pilih Foto / Gambar",
    imgDropHint: "atau seret foto JPG / PNG / WEBP ke sini",
    imgUploadHint: "100% diproses di browser — foto KTP/wajah tidak dikirim ke server",
    imgReadError: "Gagal membaca gambar yang dipilih",
    altScanFlow: "Kompres Foto ke Target KB",
  },
  en: {
    origLabel: "Original Size",
    targetLabel: "Target Limit",
    outputLabel: "Compressed Size",
    passBadge: (kb) => `Passes <= ${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`} target`,
    overBadge: (kb) => `Output still above ${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`} (heavy scanned images)`,
    overHint:
      "This PDF likely contains high-resolution camera scans. To force it under the target limit, export pages via PDF to JPG, shrink images with our target-KB image tool, then convert back with JPG to PDF:",
    compressPdfBtn: "Compress & Check Target Size",
    compressImgBtn: "Auto-Compress Under Target",
    processing: "Calibrating file size...",
    downloadBtn: "Download Output",
    remove: "Remove file",
    imgDropChoose: "Select Photo / Image",
    imgDropHint: "or drag JPG / PNG / WEBP here",
    imgUploadHint: "100% browser-side — images never leave your device",
    imgReadError: "Could not decode the selected image",
    altScanFlow: "Target-KB Image Compressor",
  },
  ja: {
    origLabel: "元のサイズ",
    targetLabel: "目標上限",
    outputLabel: "圧縮後のサイズ",
    passBadge: (kb) => `${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`} 以下の基準をクリア`,
    overBadge: (kb) => `${kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`} を超過（高解像度スキャン画像）`,
    overHint:
      "高解像度のスキャン画像が含まれているため、一度「PDFをJPG化」してから目標容量の画像圧縮を行い、「JPGをPDF化」で戻すと確実に収まります。",
    compressPdfBtn: "PDFを圧縮してサイズ判定",
    compressImgBtn: "目標サイズ以下に自動圧縮",
    processing: "目標サイズに合わせて最適化中...",
    downloadBtn: "結果をダウンロード",
    remove: "ファイルを変更",
    imgDropChoose: "画像を選択",
    imgDropHint: "JPG / PNG / WEBP をここにドロップ",
    imgUploadHint: "100%ブラウザ完結・画像は外部に送信されません",
    imgReadError: "画像を読み込めませんでした",
    altScanFlow: "目標サイズ画像圧縮へ",
  },
};

function TargetPdfCompressor({
  title,
  description,
  targetKb,
  locale,
}: {
  title: string;
  description: string;
  targetKb: number;
  locale: PresetLocale;
}) {
  const t = useTranslations("compressPdf");
  const tCommon = useTranslations("common");
  const ui = UI_BY_LOCALE[locale];

  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);

  const targetBytes = targetKb * 1024;
  const targetDisplay = targetKb >= 1024 ? `${targetKb / 1024} MB` : `${targetKb} KB`;
  const passed = resultSize !== null && resultSize <= targetBytes;

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setResultSize(null);
    setError(null);
  }

  async function onCompress() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/v1/pdf/compress`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      const blob = await responseToBlob(res);
      setResultSize(blob.size);
      await downloadBlob(
        new Response(blob, { status: 200, headers: res.headers }),
        keepOriginalName(file, `compressed-${targetKb}kb.pdf`, "pdf"),
      );
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric"), locale));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={title} description={description}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
        <span>{ui.targetLabel}:</span>
        <strong>&lt;= {targetDisplay}</strong>
      </div>

      {!file ? (
        <PdfDropzone
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={takeFiles}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            <PdfDocumentThumb file={file} className="h-40 w-28 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-base font-semibold text-[color:var(--ink)]">{file.name}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-lg bg-[color:var(--ink)]/5 px-2.5 py-1">
                  {ui.origLabel}: <strong>{formatFileSize(file.size)}</strong>
                </span>
                <span className="rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 py-1">
                  {ui.targetLabel}: <strong>&lt;= {targetDisplay}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResultSize(null);
                  setError(null);
                }}
                className="text-xs text-[color:var(--ink)]/60 hover:text-red-600 underline cursor-pointer"
              >
                {ui.remove}
              </button>
            </div>
          </div>

          {resultSize !== null && (
            <div
              className={`rounded-2xl p-4 border text-xs space-y-2 ${
                passed
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-800 dark:text-teal-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {passed ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span>
                  {ui.outputLabel}: <strong>{formatFileSize(resultSize)}</strong> —{" "}
                  {passed ? ui.passBadge(targetKb) : ui.overBadge(targetKb)}
                </span>
              </div>
              {!passed && (
                <div className="space-y-2 pt-1">
                  <p className="opacity-85 leading-relaxed">{ui.overHint}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/tools/pdf-to-jpg"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-zinc-900 px-2.5 py-1 font-medium border border-amber-500/30 hover:border-teal-500 transition"
                    >
                      PDF to JPG <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href={targetKb <= 100 ? "/presets/compress-jpg-100kb" : "/presets/compress-jpg-200kb"}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-zinc-900 px-2.5 py-1 font-medium border border-amber-500/30 hover:border-teal-500 transition"
                    >
                      {ui.altScanFlow} <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href="/tools/jpg-to-pdf"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-zinc-900 px-2.5 py-1 font-medium border border-amber-500/30 hover:border-teal-500 transition"
                    >
                      JPG to PDF <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <ErrorBanner message={error} />

          <Button type="button" loading={downloading} onClick={onCompress} disabled={downloading}>
            {downloading ? ui.processing : ui.compressPdfBtn}
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

async function canvasToJpegBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Compression encoding failed"));
        else resolve(b);
      },
      "image/jpeg",
      quality,
    );
  });
}

function TargetImageCompressor({
  title,
  description,
  targetKb,
  locale,
}: {
  title: string;
  description: string;
  targetKb: number;
  locale: PresetLocale;
}) {
  const ui = UI_BY_LOCALE[locale];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetBytes = targetKb * 1024;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setCompressedBlob(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
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
      const src = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(ui.imgReadError));
        img.src = src;
      });
      URL.revokeObjectURL(src);

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const maxEdges = [2048, 1600, 1280, 960, 720, 540];

      let bestUnder: Blob | null = null;
      let fallbackSmallest: Blob | null = null;

      for (const maxEdge of maxEdges) {
        const scale = Math.max(origW, origH) > maxEdge ? maxEdge / Math.max(origW, origH) : 1;
        const w = Math.max(1, Math.round(origW * scale));
        const h = Math.max(1, Math.round(origH * scale));

        // Quick upper-bound check at q=0.92
        const highBlob = await canvasToJpegBlob(img, w, h, 0.92);
        if (!fallbackSmallest || highBlob.size < fallbackSmallest.size) fallbackSmallest = highBlob;
        if (highBlob.size <= targetBytes) {
          bestUnder = highBlob;
          break;
        }

        // Binary search quality between 0.25 and 0.90
        let lo = 0.25;
        let hi = 0.9;
        let localBest: Blob | null = null;
        for (let step = 0; step < 6; step++) {
          const mid = (lo + hi) / 2;
          const candidate = await canvasToJpegBlob(img, w, h, mid);
          if (!fallbackSmallest || candidate.size < fallbackSmallest.size) fallbackSmallest = candidate;
          if (candidate.size <= targetBytes) {
            localBest = candidate;
            lo = mid;
          } else {
            hi = mid;
          }
        }
        if (localBest) {
          bestUnder = localBest;
          break;
        }
      }

      setCompressedBlob(bestUnder ?? fallbackSmallest);
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.imgReadError);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressedBlob || !compressedUrl || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `${baseName}-${targetKb}kb.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <ToolShell title={title} description={description}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
        <span>{ui.targetLabel}:</span>
        <strong>&lt;= {targetKb} KB</strong>
      </div>

      {!file ? (
        <PdfDropzone
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple={false}
          labels={{
            choose: ui.imgDropChoose,
            drop: ui.imgDropHint,
            hint: ui.imgUploadHint,
          }}
          onFiles={(list) => {
            const picked = list?.[0];
            if (picked) {
              setFile(picked);
              setCompressedBlob(null);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            {previewUrl && (
              <img
                src={compressedUrl || previewUrl}
                alt={file.name}
                className="h-32 w-32 rounded-2xl object-cover border border-[color:var(--ink)]/10 bg-zinc-100 dark:bg-zinc-900 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-base font-semibold text-[color:var(--ink)]">{file.name}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-[color:var(--ink)]/5 px-2.5 py-1">
                  {ui.origLabel}: <strong>{formatFileSize(file.size)}</strong>
                </span>
                {compressedBlob && (
                  <span className="rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 py-1 inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {ui.outputLabel}: <strong>{formatFileSize(compressedBlob.size)}</strong>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setCompressedBlob(null);
                  setError(null);
                }}
                className="text-xs text-[color:var(--ink)]/60 hover:text-red-600 underline cursor-pointer"
              >
                {ui.remove}
              </button>
            </div>
          </div>

          {compressedBlob && (
            <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-3.5 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{ui.passBadge(targetKb)}</span>
            </div>
          )}

          <ErrorBanner message={error} />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" loading={processing} onClick={handleCompress} disabled={processing}>
              {processing ? ui.processing : ui.compressImgBtn}
            </Button>
            {compressedBlob && (
              <Button type="button" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                {ui.downloadBtn} ({formatFileSize(compressedBlob.size)})
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

export function PresetToolBoard({
  toolKind,
  title,
  description,
  targetKb,
  locale,
}: {
  toolKind: PresetToolKind;
  title: string;
  description: string;
  targetKb?: number;
  locale: PresetLocale;
}) {
  switch (toolKind) {
    case "compress-pdf-target":
      return (
        <TargetPdfCompressor
          title={title}
          description={description}
          targetKb={targetKb ?? 200}
          locale={locale}
        />
      );
    case "compress-image-target":
      return (
        <TargetImageCompressor
          title={title}
          description={description}
          targetKb={targetKb ?? 200}
          locale={locale}
        />
      );
    case "pas-foto":
      return <PasFotoBoard />;
    case "resize-image":
      return <ResizeImageBoard />;
    case "merge-pdf":
      return <MergePdfBoard />;
    case "remove-signature-bg":
      return <RemoveSignatureBgBoard />;
  }
}

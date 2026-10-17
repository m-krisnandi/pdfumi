"use client";

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { redactPdf, type RedactionBox } from "@/lib/pdfLibUtils";
import {
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldAlert,
} from "lucide-react";

export function RedactPdfBoard() {
  const t = useTranslations("redactPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [redactionColor, setRedactionColor] = useState<"black" | "white">("black");
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    async function renderPage() {
      try {
        const pdfjs = await loadPdfJs();
        const bytes = await file!.arrayBuffer();
        const loadingTask = pdfjs.getDocument(getPdfDocumentParams(bytes));
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // @ts-expect-error pdfjs typing
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat dokumen PDF");
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [file, currentPage]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setIsDrawing(true);
    setDrawStart({ x, y });
    setDragCurrent({ x, y });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDrawing || !containerRef.current || !drawStart) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDragCurrent({ x, y });
  }

  function handlePointerUp() {
    if (!isDrawing || !drawStart || !dragCurrent) {
      setIsDrawing(false);
      return;
    }

    const minX = Math.min(drawStart.x, dragCurrent.x);
    const minY = Math.min(drawStart.y, dragCurrent.y);
    const width = Math.abs(dragCurrent.x - drawStart.x);
    const height = Math.abs(dragCurrent.y - drawStart.y);

    if (width > 0.01 && height > 0.01) {
      const newBox: RedactionBox = {
        page: currentPage,
        x: minX,
        y: minY,
        width,
        height,
        color: redactionColor,
      };
      setBoxes((prev) => [...prev, newBox]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDragCurrent(null);
  }

  function removeBox(index: number) {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleRedactAndDownload() {
    if (!file) return;
    if (boxes.length === 0) {
      setError(t("needBoxes"));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const redactedBlob = await redactPdf(file, boxes);
      const url = URL.createObjectURL(redactedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-redacted.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyensor dokumen");
    } finally {
      setProcessing(false);
    }
  }

  const currentBoxes = boxes
    .map((box, idx) => ({ ...box, originalIndex: idx }))
    .filter((b) => b.page === currentPage);

  return (
    <ToolShell
      title={t("title")}
      description={t("description")}
      wide
    >
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
              setCurrentPage(1);
              setBoxes([]);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-xs">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-red-500 hover:underline"
              >
                {tCommon("remove")}
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/10 rounded-full px-3 py-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1 disabled:opacity-30 hover:text-teal-600 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 disabled:opacity-30 hover:text-teal-600 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Button
              type="button"
              onClick={handleRedactAndDownload}
              loading={processing}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t("downloadRedacted")}</span>
            </Button>
          </div>

          {/* Color & Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Warna Sensor:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRedactionColor("black")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    redactionColor === "black"
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-black inline-block border border-white/20" />
                  <span>Hitam (Blackout)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRedactionColor("white")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    redactionColor === "white"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white inline-block border border-zinc-400" />
                  <span>Putih (Whiteout)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Tarik kursor (drag) di atas area sensitif untuk menyensor permanen</span>
            </div>
          </div>

          <ErrorBanner message={error} />

          {/* Canvas & Redaction workspace */}
          <div className="flex justify-center overflow-auto p-4 bg-zinc-200/60 dark:bg-zinc-950/60 rounded-2xl">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative inline-block shadow-2xl rounded-lg overflow-hidden cursor-crosshair select-none bg-white"
            >
              <canvas ref={canvasRef} className="block max-w-full h-auto" />

              {/* Redaction Boxes */}
              {currentBoxes.map((box) => (
                <div
                  key={box.originalIndex}
                  style={{
                    position: "absolute",
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                    backgroundColor: box.color === "black" ? "#000000" : "#ffffff",
                    border: box.color === "white" ? "1px dashed #999" : "none",
                  }}
                  className="group pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBox(box.originalIndex);
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white shadow cursor-pointer"
                    title="Hapus tanda sensor"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Drawing Preview */}
              {isDrawing && drawStart && dragCurrent && (
                <div
                  style={{
                    position: "absolute",
                    left: `${Math.min(drawStart.x, dragCurrent.x) * 100}%`,
                    top: `${Math.min(drawStart.y, dragCurrent.y) * 100}%`,
                    width: `${Math.abs(dragCurrent.x - drawStart.x) * 100}%`,
                    height: `${Math.abs(dragCurrent.y - drawStart.y) * 100}%`,
                    backgroundColor: redactionColor === "black" ? "#000000" : "#ffffff",
                    opacity: 0.7,
                  }}
                  className="pointer-events-none border-2 border-red-500 border-dashed"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

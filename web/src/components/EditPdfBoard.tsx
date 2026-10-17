"use client";

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Type,
  Square,
  Highlighter,
  PenTool,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

type TextAnnotation = {
  id: string;
  page: number;
  type: "text";
  text: string;
  x: number; // 0-1
  y: number; // 0-1 from top
  size: number;
  color: string;
};

type ShapeAnnotation = {
  id: string;
  page: number;
  type: "rect" | "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
};

type Annotation = TextAnnotation | ShapeAnnotation;

export function EditPdfBoard() {
  const t = useTranslations("editPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Tools: select | text | highlight | rect
  const [activeTool, setActiveTool] = useState<"select" | "text" | "highlight" | "rect">("text");
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(16);
  const [inputText, setInputText] = useState("Ketik teks di sini");

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render current page via pdfjs
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

    if (activeTool === "text") {
      const newAnno: TextAnnotation = {
        id: Math.random().toString(36).slice(2),
        page: currentPage,
        type: "text",
        text: inputText || "Teks baru",
        x,
        y,
        size: textSize,
        color: textColor,
      };
      setAnnotations((prev) => [...prev, newAnno]);
    } else if (activeTool === "rect" || activeTool === "highlight") {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDragCurrent({ x, y });
    }
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
      const newShape: ShapeAnnotation = {
        id: Math.random().toString(36).slice(2),
        page: currentPage,
        type: activeTool === "highlight" ? "highlight" : "rect",
        x: minX,
        y: minY,
        width,
        height,
        color: activeTool === "highlight" ? "#fef08a" : textColor,
        opacity: activeTool === "highlight" ? 0.45 : 1.0,
      };
      setAnnotations((prev) => [...prev, newShape]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDragCurrent(null);
  }

  function removeAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleExport() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const anno of annotations) {
        if (anno.page < 1 || anno.page > doc.getPageCount()) continue;
        const page = doc.getPage(anno.page - 1);
        const { width: pW, height: pH } = page.getSize();

        if (anno.type === "text") {
          const drawX = anno.x * pW;
          const drawY = pH - (anno.y * pH) - anno.size;

          const r = parseInt(anno.color.slice(1, 3), 16) / 255;
          const g = parseInt(anno.color.slice(3, 5), 16) / 255;
          const b = parseInt(anno.color.slice(5, 7), 16) / 255;

          page.drawText(anno.text, {
            x: drawX,
            y: drawY,
            size: anno.size,
            font,
            color: rgb(r, g, b),
          });
        } else if (anno.type === "rect" || anno.type === "highlight") {
          const drawX = anno.x * pW;
          const drawW = anno.width * pW;
          const drawH = anno.height * pH;
          const drawY = pH - (anno.y * pH) - drawH;

          const hex = anno.color.startsWith("#") ? anno.color : "#fef08a";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;

          page.drawRectangle({
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
            color: rgb(r, g, b),
            opacity: anno.opacity,
          });
        }
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-edited.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan PDF hasil edit");
    } finally {
      setProcessing(false);
    }
  }

  const currentAnnotations = annotations.filter((a) => a.page === currentPage);

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
              setAnnotations([]);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
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

            {/* Export Button */}
            <Button
              type="button"
              onClick={handleExport}
              loading={processing}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t("downloadEdited")}</span>
            </Button>
          </div>

          {/* Tools Palette */}
          <div className="flex flex-wrap items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-1.5 border-r border-zinc-200 dark:border-white/10 pr-3">
              <button
                type="button"
                onClick={() => setActiveTool("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTool === "text"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Type className="w-4 h-4" />
                <span>{t("toolText")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("highlight")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTool === "highlight"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span>{t("toolHighlight")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("rect")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTool === "rect"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Square className="w-4 h-4" />
                <span>{t("toolShape")}</span>
              </button>
            </div>

            {/* Context Tool Controls */}
            {activeTool === "text" && (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik teks yang ingin ditempel..."
                  className="rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none w-56"
                />
                <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Ukuran:</span>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="w-14 rounded-lg border border-zinc-300 dark:border-white/20 bg-white dark:bg-zinc-800 px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span>Warna:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                </div>
              </div>
            )}

            <div className="text-[11px] text-zinc-500 ml-auto">
              {activeTool === "text"
                ? "Klik pada dokumen untuk menempel teks"
                : "Tarik kursor (drag) untuk membuat kotak / sorotan"}
            </div>
          </div>

          <ErrorBanner message={error} />

          {/* Canvas & Overlay Workspace */}
          <div className="flex justify-center overflow-auto p-4 bg-zinc-200/60 dark:bg-zinc-950/60 rounded-2xl">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative inline-block shadow-2xl rounded-lg overflow-hidden cursor-crosshair select-none bg-white"
            >
              <canvas ref={canvasRef} className="block max-w-full h-auto" />

              {/* Render Existing Annotations for this page */}
              {currentAnnotations.map((anno) => {
                if (anno.type === "text") {
                  return (
                    <div
                      key={anno.id}
                      style={{
                        position: "absolute",
                        left: `${anno.x * 100}%`,
                        top: `${anno.y * 100}%`,
                        color: anno.color,
                        fontSize: `${anno.size * 1.5}px`, // scale factor with canvas
                        transform: "translate(0, 0)",
                      }}
                      className="group flex items-center gap-1 leading-none font-sans font-medium px-1 rounded hover:ring-1 hover:ring-teal-500 bg-white/10"
                    >
                      <span>{anno.text}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(anno.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-red-600 text-white text-[10px] ml-1 shadow cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                if (anno.type === "rect" || anno.type === "highlight") {
                  return (
                    <div
                      key={anno.id}
                      style={{
                        position: "absolute",
                        left: `${anno.x * 100}%`,
                        top: `${anno.y * 100}%`,
                        width: `${anno.width * 100}%`,
                        height: `${anno.height * 100}%`,
                        backgroundColor: anno.color,
                        opacity: anno.opacity,
                      }}
                      className="group border border-transparent hover:border-teal-500 pointer-events-auto"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(anno.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white shadow cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                return null;
              })}

              {/* Live Drawing Preview */}
              {isDrawing && drawStart && dragCurrent && (
                <div
                  style={{
                    position: "absolute",
                    left: `${Math.min(drawStart.x, dragCurrent.x) * 100}%`,
                    top: `${Math.min(drawStart.y, dragCurrent.y) * 100}%`,
                    width: `${Math.abs(dragCurrent.x - drawStart.x) * 100}%`,
                    height: `${Math.abs(dragCurrent.y - drawStart.y) * 100}%`,
                    backgroundColor: activeTool === "highlight" ? "#fef08a" : textColor,
                    opacity: activeTool === "highlight" ? 0.45 : 0.8,
                  }}
                  className="pointer-events-none border border-teal-500 border-dashed"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

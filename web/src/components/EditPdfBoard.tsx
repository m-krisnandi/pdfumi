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
  Circle,
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  Minus,
  MessageSquare,
  MousePointer2,
  Square,
  Trash2,
  Type,
} from "lucide-react";

type Tool = "select" | "text" | "highlight" | "rect" | "ellipse" | "line" | "callout";
type ShapeType = Exclude<Tool, "select" | "text">;

type TextAnnotation = {
  id: string;
  page: number;
  type: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  color: string;
};

type ShapeAnnotation = {
  id: string;
  page: number;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  opacity: number;
  borderWidth: number;
  label?: string;
  labelColor?: string;
  labelSize?: number;
};

type Annotation = TextAnnotation | ShapeAnnotation;

type Interaction =
  | { kind: "move"; id: string; offsetX: number; offsetY: number }
  | { kind: "resize"; id: string; startX: number; startY: number; width: number; height: number }
  | null;

const MIN_SIZE = 0.015;

function makeId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function colorToRgb(hex: string) {
  const value = hex.replace("#", "");
  const safe = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  return rgb(
    parseInt(safe.slice(0, 2), 16) / 255,
    parseInt(safe.slice(2, 4), 16) / 255,
    parseInt(safe.slice(4, 6), 16) / 255,
  );
}

function normalizedPoint(event: React.PointerEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

export function EditPdfBoard() {
  const t = useTranslations("editPdf");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<Interaction>(null);

  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(16);
  const [inputText, setInputText] = useState("Ketik teks di sini");
  const [shapeFill, setShapeFill] = useState("#bfdbfe");
  const [shapeBorder, setShapeBorder] = useState("#111827");
  const [shapeOpacity, setShapeOpacity] = useState(0.82);
  const [shapeBorderWidth, setShapeBorderWidth] = useState(2);
  const [calloutText, setCalloutText] = useState("Komentar");

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    async function renderPage() {
      try {
        const pdfjs = await loadPdfJs();
        const bytes = await file!.arrayBuffer();
        const pdf = await pdfjs.getDocument(getPdfDocumentParams(bytes)).promise;
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat dokumen PDF");
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
    };
  }, [file, currentPage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId && !editing) {
        event.preventDefault();
        setAnnotations((prev) => prev.filter((annotation) => annotation.id !== selectedId));
        setSelectedId(null);
      } else if (event.key === "Escape") {
        setSelectedId(null);
        setInteraction(null);
        setIsDrawing(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function setPage(page: number) {
    setCurrentPage(page);
    setSelectedId(null);
    setInteraction(null);
  }

  function removeAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function updateAnnotation(id: string, patch: Partial<Annotation>) {
    setAnnotations((prev) => prev.map((annotation) => (annotation.id === id ? { ...annotation, ...patch } as Annotation : annotation)));
  }

  function handleCanvasPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container || (event.target as HTMLElement).closest("[data-annotation-id]")) return;
    const point = normalizedPoint(event, container);

    if (activeTool === "text") {
      const annotation: TextAnnotation = {
        id: makeId(),
        page: currentPage,
        type: "text",
        text: inputText.trim() || "Teks baru",
        x: point.x,
        y: point.y,
        width: 0.32,
        height: 0.06,
        size: textSize,
        color: textColor,
      };
      setAnnotations((prev) => [...prev, annotation]);
      setSelectedId(annotation.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

    setIsDrawing(true);
    setDrawStart(point);
    setDrawCurrent(point);
    container.setPointerCapture?.(event.pointerId);
  }

  function handleAnnotationPointerDown(event: React.PointerEvent<HTMLDivElement>, id: string) {
    event.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const annotation = annotations.find((item) => item.id === id);
    if (!annotation) return;
    const point = normalizedPoint(event, container);
    setSelectedId(id);
    setActiveTool("select");
    setInteraction({ kind: "move", id, offsetX: point.x - annotation.x, offsetY: point.y - annotation.y });
    container.setPointerCapture?.(event.pointerId);
  }

  function handleResizePointerDown(event: React.PointerEvent<HTMLButtonElement>, annotation: Annotation) {
    event.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const point = normalizedPoint(event, container);
    setSelectedId(annotation.id);
    setInteraction({
      kind: "resize",
      id: annotation.id,
      startX: point.x,
      startY: point.y,
      width: annotation.width,
      height: annotation.height,
    });
    container.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    const point = normalizedPoint(event, container);

    if (isDrawing && drawStart) {
      setDrawCurrent(point);
      return;
    }

    if (!interaction) return;
    if (interaction.kind === "move") {
      const annotation = annotations.find((item) => item.id === interaction.id);
      if (!annotation) return;
      const x = clamp(point.x - interaction.offsetX, 0, 1 - annotation.width);
      const y = clamp(point.y - interaction.offsetY, 0, 1 - annotation.height);
      updateAnnotation(annotation.id, { x, y });
    } else {
      const dx = point.x - interaction.startX;
      const dy = point.y - interaction.startY;
      updateAnnotation(interaction.id, {
        width: clamp(Math.max(MIN_SIZE, interaction.width + dx), MIN_SIZE, 1),
        height: clamp(Math.max(MIN_SIZE, interaction.height + dy), MIN_SIZE, 1),
      });
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (container?.hasPointerCapture?.(event.pointerId)) container.releasePointerCapture(event.pointerId);

    if (isDrawing && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.max(MIN_SIZE, Math.abs(drawCurrent.x - drawStart.x));
      const height = Math.max(MIN_SIZE, Math.abs(drawCurrent.y - drawStart.y));
      if (width >= MIN_SIZE && height >= MIN_SIZE) {
        const type = activeTool as ShapeType;
        const annotation: ShapeAnnotation = {
          id: makeId(),
          page: currentPage,
          type,
          x: clamp(x, 0, 1 - width),
          y: clamp(y, 0, 1 - height),
          width: clamp(width, MIN_SIZE, 1),
          height: clamp(height, MIN_SIZE, 1),
          fillColor: type === "highlight" ? "#fef08a" : shapeFill,
          borderColor: type === "highlight" ? "#facc15" : shapeBorder,
          opacity: type === "highlight" ? 0.45 : shapeOpacity,
          borderWidth: type === "highlight" ? 1 : shapeBorderWidth,
          label: type === "callout" ? calloutText.trim() || "Komentar" : undefined,
          labelColor: textColor,
          labelSize: textSize,
        };
        setAnnotations((prev) => [...prev, annotation]);
        setSelectedId(annotation.id);
        setActiveTool("select");
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setInteraction(null);
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (container?.hasPointerCapture?.(event.pointerId)) container.releasePointerCapture(event.pointerId);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setInteraction(null);
  }

  async function handleExport() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const annotation of annotations) {
        if (annotation.page < 1 || annotation.page > doc.getPageCount()) continue;
        const page = doc.getPage(annotation.page - 1);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        if (annotation.type === "text") {
          page.drawText(annotation.text, {
            x: annotation.x * pageWidth,
            y: pageHeight - annotation.y * pageHeight - annotation.size,
            size: annotation.size,
            font,
            color: colorToRgb(annotation.color),
            maxWidth: annotation.width * pageWidth,
          });
          continue;
        }

        const drawX = annotation.x * pageWidth;
        const drawW = annotation.width * pageWidth;
        const drawH = annotation.height * pageHeight;
        const drawY = pageHeight - annotation.y * pageHeight - drawH;
        const fill = colorToRgb(annotation.fillColor);
        const border = colorToRgb(annotation.borderColor);

        if (annotation.type === "line") {
          page.drawLine({
            start: { x: drawX, y: drawY + drawH },
            end: { x: drawX + drawW, y: drawY },
            color: border,
            thickness: annotation.borderWidth,
            opacity: annotation.opacity,
          });
        } else if (annotation.type === "ellipse") {
          page.drawEllipse({
            x: drawX + drawW / 2,
            y: drawY + drawH / 2,
            xScale: drawW / 2,
            yScale: drawH / 2,
            color: fill,
            borderColor: border,
            borderWidth: annotation.borderWidth,
            opacity: annotation.opacity,
            borderOpacity: Math.min(1, annotation.opacity + 0.18),
          });
        } else {
          page.drawRectangle({
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
            color: fill,
            borderColor: border,
            borderWidth: annotation.borderWidth,
            opacity: annotation.opacity,
            borderOpacity: Math.min(1, annotation.opacity + 0.18),
          });
          if (annotation.type === "callout") {
            page.drawLine({
              start: { x: drawX, y: drawY },
              end: { x: Math.max(0, drawX - pageWidth * 0.08), y: Math.max(0, drawY - pageHeight * 0.06) },
              color: border,
              thickness: annotation.borderWidth,
              opacity: annotation.opacity,
            });
            page.drawText(annotation.label || "Komentar", {
              x: drawX + pageWidth * 0.012,
              y: drawY + drawH / 2 - (annotation.labelSize || 12) / 2,
              size: annotation.labelSize || 12,
              font,
              color: colorToRgb(annotation.labelColor || "#111827"),
              maxWidth: Math.max(20, drawW - pageWidth * 0.024),
            });
          }
        }
      }

      const output = await doc.save();
      const blob = new Blob([output.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.replace(/\.pdf$/i, "-edited.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan PDF hasil edit");
    } finally {
      setProcessing(false);
    }
  }

  const currentAnnotations = annotations.filter((annotation) => annotation.page === currentPage);
  const selectedAnnotation = annotations.find((annotation) => annotation.id === selectedId);
  const toolButton = (tool: Tool, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setActiveTool(tool)}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
        activeTool === tool
          ? "bg-teal-600 text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      {!file ? (
        <PdfDropzone
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={(list) => {
            const selected = list?.[0];
            if (!selected) return;
            setFile(selected);
            setCurrentPage(1);
            setTotalPages(1);
            setAnnotations([]);
            setSelectedId(null);
            setError(null);
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/60 pb-4 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 underline">
                {tCommon("remove")}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 dark:bg-white/10">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="p-1 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold">{currentPage} / {totalPages}</span>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="p-1 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button type="button" onClick={handleExport} loading={processing} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>{t("downloadEdited")}</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/50">
            {toolButton("select", t("toolSelect"), <MousePointer2 className="h-4 w-4" />)}
            {toolButton("text", t("toolText"), <Type className="h-4 w-4" />)}
            {toolButton("highlight", t("toolHighlight"), <Highlighter className="h-4 w-4" />)}
            {toolButton("rect", t("toolRectangle"), <Square className="h-4 w-4" />)}
            {toolButton("ellipse", t("toolEllipse"), <Circle className="h-4 w-4" />)}
            {toolButton("line", t("toolLine"), <Minus className="h-4 w-4" />)}
            {toolButton("callout", t("toolCallout"), <MessageSquare className="h-4 w-4" />)}
            <div className="ml-auto text-[11px] text-zinc-500">
              {activeTool === "select" ? t("selectHint") : activeTool === "text" ? t("textHint") : t("drawHint")}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0 overflow-auto rounded-2xl bg-zinc-200/60 p-4 dark:bg-zinc-950/60">
              <div
                ref={containerRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={`relative mx-auto inline-block touch-none select-none overflow-hidden rounded-lg bg-white shadow-2xl ${activeTool === "select" ? "cursor-default" : "cursor-crosshair"}`}
              >
                <canvas ref={canvasRef} className="pointer-events-none block max-w-full" />
                {currentAnnotations.map((annotation) => {
                  const selected = annotation.id === selectedId;
                  const isLine = annotation.type === "line";
                  const style: React.CSSProperties = {
                    left: `${annotation.x * 100}%`,
                    top: `${annotation.y * 100}%`,
                    width: isLine ? `${Math.max(2, Math.hypot(annotation.width, annotation.height) * 100)}%` : `${annotation.width * 100}%`,
                    height: isLine ? "0px" : `${annotation.height * 100}%`,
                  };

                  return (
                    <div
                      key={annotation.id}
                      data-annotation-id={annotation.id}
                      onPointerDown={(event) => handleAnnotationPointerDown(event, annotation.id)}
                      style={
                        annotation.type === "text"
                          ? { ...style, color: annotation.color, fontSize: `${annotation.size * 1.5}px` }
                          : isLine
                            ? { ...style, borderTop: `${annotation.borderWidth}px solid ${annotation.borderColor}`, transform: `rotate(${Math.atan2(annotation.height, annotation.width)}rad)`, transformOrigin: "left center", opacity: annotation.opacity }
                            : { ...style, backgroundColor: annotation.fillColor, border: `${annotation.borderWidth}px solid ${annotation.borderColor}`, opacity: annotation.opacity, borderRadius: annotation.type === "ellipse" ? "9999px" : "0.25rem" }
                      }
                      className={`group absolute z-10 ${selected ? "ring-2 ring-teal-500 ring-offset-1" : "hover:ring-1 hover:ring-teal-400"} ${annotation.type === "text" ? "whitespace-pre-wrap p-1 font-medium leading-tight" : ""}`}
                    >
                      {annotation.type === "text" ? annotation.text : annotation.type === "callout" ? <span className="block px-2 py-1 text-xs font-semibold" style={{ color: annotation.labelColor, fontSize: `${(annotation.labelSize || 12) * 1.5}px` }}>{annotation.label}</span> : null}
                      {selected ? (
                        <>
                          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => removeAnnotation(annotation.id)} className="absolute -right-3 -top-3 z-30 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700" title={t("deleteAnnotation")}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <button type="button" onPointerDown={(event) => handleResizePointerDown(event, annotation)} className="absolute -bottom-2 -right-2 z-30 h-4 w-4 cursor-se-resize rounded-sm border-2 border-white bg-teal-600 shadow" aria-label={t("resizeAnnotation")} />
                        </>
                      ) : null}
                    </div>
                  );
                })}
                {isDrawing && drawStart && drawCurrent ? (
                  <div
                    className="pointer-events-none absolute z-20 border-2 border-dashed border-teal-500"
                    style={{
                      left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                      top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                      width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                      height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                      backgroundColor: activeTool === "highlight" ? "#fef08a" : shapeFill,
                      opacity: activeTool === "highlight" ? 0.45 : shapeOpacity,
                    }}
                  />
                ) : null}
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
              {activeTool === "text" || selectedAnnotation?.type === "text" ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold">{t("textSettings")}</h3>
                  <label className="block text-xs font-medium">{t("textLabel")}
                    <textarea value={selectedAnnotation?.type === "text" ? selectedAnnotation.text : inputText} onChange={(event) => selectedAnnotation?.type === "text" ? updateAnnotation(selectedAnnotation.id, { text: event.target.value }) : setInputText(event.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-white/20 dark:bg-zinc-800" />
                  </label>
                  <label className="block text-xs font-medium">{t("fontSize")}
                    <input type="number" min={8} max={96} value={selectedAnnotation?.type === "text" ? selectedAnnotation.size : textSize} onChange={(event) => { const value = Number(event.target.value); selectedAnnotation?.type === "text" ? updateAnnotation(selectedAnnotation.id, { size: value }) : setTextSize(value); }} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-800" />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium">{t("textColor")}<input type="color" value={selectedAnnotation?.type === "text" ? selectedAnnotation.color : textColor} onChange={(event) => selectedAnnotation?.type === "text" ? updateAnnotation(selectedAnnotation.id, { color: event.target.value }) : setTextColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded" /></label>
                  {selectedAnnotation?.type === "text" ? <button type="button" onClick={() => removeAnnotation(selectedAnnotation.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"><Trash2 className="h-4 w-4" />{t("deleteAnnotation")}</button> : null}
                </div>
              ) : selectedAnnotation ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold">{t("shapeSettings")}</h3>
                  <label className="flex items-center justify-between text-xs font-medium">{t("fillColor")}<input type="color" value={selectedAnnotation.fillColor} onChange={(event) => updateAnnotation(selectedAnnotation.id, { fillColor: event.target.value })} className="h-8 w-10 cursor-pointer rounded" /></label>
                  <label className="flex items-center justify-between text-xs font-medium">{t("borderColor")}<input type="color" value={selectedAnnotation.borderColor} onChange={(event) => updateAnnotation(selectedAnnotation.id, { borderColor: event.target.value })} className="h-8 w-10 cursor-pointer rounded" /></label>
                  <label className="block text-xs font-medium">{t("opacity")} <input type="range" min={0.1} max={1} step={0.05} value={selectedAnnotation.opacity} onChange={(event) => updateAnnotation(selectedAnnotation.id, { opacity: Number(event.target.value) })} className="mt-2 w-full" /></label>
                  <label className="block text-xs font-medium">{t("borderWidth")} <input type="number" min={1} max={12} value={selectedAnnotation.borderWidth} onChange={(event) => updateAnnotation(selectedAnnotation.id, { borderWidth: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-800" /></label>
                  {selectedAnnotation.type === "callout" ? <label className="block text-xs font-medium">{t("calloutText")}<textarea value={selectedAnnotation.label || ""} onChange={(event) => updateAnnotation(selectedAnnotation.id, { label: event.target.value })} className="mt-1 min-h-16 w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-white/20 dark:bg-zinc-800" /></label> : null}
                  <button type="button" onClick={() => removeAnnotation(selectedAnnotation.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"><Trash2 className="h-4 w-4" />{t("deleteAnnotation")}</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold">{t("newShapeSettings")}</h3>
                  <label className="flex items-center justify-between text-xs font-medium">{t("fillColor")}<input type="color" value={shapeFill} onChange={(event) => setShapeFill(event.target.value)} className="h-8 w-10 cursor-pointer rounded" /></label>
                  <label className="flex items-center justify-between text-xs font-medium">{t("borderColor")}<input type="color" value={shapeBorder} onChange={(event) => setShapeBorder(event.target.value)} className="h-8 w-10 cursor-pointer rounded" /></label>
                  <label className="block text-xs font-medium">{t("opacity")}<input type="range" min={0.1} max={1} step={0.05} value={shapeOpacity} onChange={(event) => setShapeOpacity(Number(event.target.value))} className="mt-2 w-full" /></label>
                  <label className="block text-xs font-medium">{t("borderWidth")}<input type="number" min={1} max={12} value={shapeBorderWidth} onChange={(event) => setShapeBorderWidth(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-800" /></label>
                  {activeTool === "callout" ? <label className="block text-xs font-medium">{t("calloutText")}<textarea value={calloutText} onChange={(event) => setCalloutText(event.target.value)} className="mt-1 min-h-16 w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-white/20 dark:bg-zinc-800" /></label> : null}
                  <p className="text-[11px] text-zinc-500">{t("selectToEdit")}</p>
                </div>
              )}
            </aside>
          </div>
          <ErrorBanner message={error} />
        </div>
      )}
    </ToolShell>
  );
}

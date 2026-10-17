"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { normDeg } from "@/lib/fileRotate";
import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";
import { X } from "lucide-react";

type PreviewTarget =
  | { kind: "image"; file: File; title: string; rotation?: number }
  | { kind: "pdf-page"; file: File; pageNumber: number; title: string; rotation?: number };

/**
 * Full-size lightbox for an uploaded image or a single PDF page.
 * Honors the same rotation applied on the card thumbnail.
 */
export function OriginalPreviewModal({
  target,
  onClose,
  closeLabel = "Close",
}: {
  target: PreviewTarget | null;
  onClose: () => void;
  closeLabel?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!target || target.kind !== "image") {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(target.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target || typeof document === "undefined") return null;

  const rotation = normDeg(target.rotation ?? 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={target.title}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl glass-panel shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-white/10 px-5 py-3.5">
          <p className="min-w-0 truncate text-sm font-bold text-zinc-900 dark:text-white">{target.title}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-zinc-100/60 dark:bg-zinc-950/60 p-4 sm:p-6">
          {target.kind === "image" && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={target.title}
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-lg transition-transform duration-200"
              style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
            />
          ) : target.kind === "pdf-page" ? (
            <PdfPageRenderer
              file={target.file}
              pageNumber={target.pageNumber}
              rotation={rotation}
              title={target.title}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PdfPageRenderer({
  file,
  pageNumber,
  rotation,
  title,
}: {
  file: File;
  pageNumber: number;
  rotation: number;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let pdfDoc: PDFDocumentProxy | null = null;

    setStatus("loading");

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const raw = await file.arrayBuffer();
        const params = getPdfDocumentParams(raw);
        const pdf = await pdfjs.getDocument(params).promise;
        pdfDoc = pdf;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }

        const page = await pdf.getPage(pageNumber);
        const inherent = page.rotate || 0;
        const totalRot = ((inherent + rotation) % 360 + 360) % 360;
        const base = page.getViewport({ scale: 1, rotation: totalRot });
        // Fit within ~900px wide preview while keeping sharpness on retina
        const cssWidth = Math.min(900, base.width);
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const scale = (cssWidth / base.width) * dpr;
        const viewport = page.getViewport({ scale, rotation: totalRot });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${Math.ceil(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.ceil(viewport.height / dpr)}px`;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        });
        await renderTask.promise;
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        /* ignore */
      }
      pdfDoc?.cleanup().catch(() => {});
    };
  }, [file, pageNumber, rotation]);

  return (
    <div className="relative flex items-center justify-center">
      {status === "loading" ? (
        <div className="flex h-64 w-64 items-center justify-center text-xs text-zinc-400">
          Loading {title}...
        </div>
      ) : status === "failed" ? (
        <div className="flex h-64 w-64 items-center justify-center text-xs text-red-500">
          Failed to render {title}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={`max-h-[75vh] max-w-full rounded-2xl object-contain shadow-lg ${
          status === "ready" ? "opacity-100" : "absolute opacity-0"
        }`}
      />
    </div>
  );
}

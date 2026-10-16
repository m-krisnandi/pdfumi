"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

/** Renders a single page thumbnail from a PDF File (1-based page index). */
export function PdfPageThumb({
  file,
  pageNumber,
  className = "h-44 w-32",
  rotation = 0,
}: {
  file: File;
  pageNumber: number;
  className?: string;
  /** Extra CSS rotate for live preview of rotate tool. */
  rotation?: number;
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
        const data = new Uint8Array(raw.slice(0));
        const pdf = await pdfjs.getDocument({
          data,
          disableAutoFetch: true,
          disableStream: true,
        }).promise;
        pdfDoc = pdf;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }

        const page = await pdf.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = 128 / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
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
      void pdfDoc?.cleanup();
    };
  }, [file, pageNumber]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 ${className}`}
      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      {status === "failed" ? (
        <div className="flex h-full items-center justify-center text-xs text-[color:var(--ink)]/50">
          p{pageNumber}
        </div>
      ) : (
        <>
          {status === "loading" ? (
            <div className="absolute inset-0 animate-pulse bg-[color:var(--accent-soft)]/60" />
          ) : null}
          <canvas
            ref={canvasRef}
            className={`mx-auto block max-h-full max-w-full object-contain ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          />
        </>
      )}
    </div>
  );
}

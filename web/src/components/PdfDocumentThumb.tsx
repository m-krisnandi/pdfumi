"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

export function PdfDocumentThumb({
  file,
  className = "h-56 w-44",
  onPageCount,
}: {
  file: File;
  className?: string;
  onPageCount?: (count: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onPageCountRef = useRef(onPageCount);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    onPageCountRef.current = onPageCount;
  }, [onPageCount]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let pdfDoc: PDFDocumentProxy | null = null;

    setStatus("loading");

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        // Copy bytes — avoids ArrayBuffer detach when the same File is read elsewhere.
        const raw = await file.arrayBuffer();
        const data = new Uint8Array(raw.slice(0));
        const pdf = await pdfjs.getDocument(getPdfDocumentParams(data)).promise;
        pdfDoc = pdf;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }

        onPageCountRef.current?.(pdf.numPages);

        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const scale = 176 / base.width;
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
        /* ignore cancel errors */
      }
      void pdfDoc?.cleanup();
    };
  }, [file]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 ${className}`}
    >
      {status === "failed" ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center">
          <span className="text-xs font-medium text-[color:var(--ink)]/55">PDF</span>
          <span className="max-w-full truncate px-1 text-[10px] text-[color:var(--ink)]/40">
            {file.name}
          </span>
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

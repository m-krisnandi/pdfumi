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

// Shared document cache to avoid re-opening and parsing large PDFs (e.g. 100 pages) dozens of times
type DocCacheEntry = {
  key: string;
  promise: Promise<PDFDocumentProxy>;
  refCount: number;
};
const docCache = new Map<string, DocCacheEntry>();

function getCachedDoc(file: File): Promise<PDFDocumentProxy> {
  const key = `${file.name}-${file.size}-${file.lastModified}`;
  let entry = docCache.get(key);
  if (!entry) {
    const promise = (async () => {
      const pdfjs = await loadPdfJs();
      const raw = await file.arrayBuffer();
      const data = new Uint8Array(raw);
      return pdfjs.getDocument({
        data,
        disableAutoFetch: true,
        disableStream: true,
      }).promise;
    })();
    entry = { key, promise, refCount: 0 };
    docCache.set(key, entry);
  }
  entry.refCount++;
  return entry.promise;
}

function releaseCachedDoc(file: File) {
  const key = `${file.name}-${file.size}-${file.lastModified}`;
  const entry = docCache.get(key);
  if (entry) {
    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.promise.then((doc) => doc.cleanup()).catch(() => {});
      docCache.delete(key);
    }
  }
}

/** Renders a single page thumbnail from a PDF File (1-based page index) using IntersectionObserver. */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Lazy render using IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let pdfDoc: PDFDocumentProxy | null = null;

    setStatus("loading");

    (async () => {
      try {
        pdfDoc = await getCachedDoc(file);
        if (cancelled) return;

        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const scale = 140 / base.width;
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
      releaseCachedDoc(file);
    };
  }, [file, pageNumber, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 ${className}`}
      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      {status === "failed" ? (
        <div className="flex h-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
          p{pageNumber}
        </div>
      ) : (
        <>
          {status === "loading" ? (
            <div className="absolute inset-0 animate-pulse bg-zinc-200/50 dark:bg-zinc-800/50 flex items-center justify-center text-[10px] text-zinc-400">
              p{pageNumber}
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className={`mx-auto block max-h-full max-w-full object-contain transition-opacity duration-200 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          />
        </>
      )}
    </div>
  );
}

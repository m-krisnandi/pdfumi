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

/**
 * Renders all PDF pages as stacked canvases in a scrollable preview pane.
 */
export function PdfPreview({
  file,
  title,
  className = "min-h-[28rem]",
  maxPages = 40,
}: {
  file: File | Blob | null;
  title: string;
  className?: string;
  /** Cap to avoid huge client-side renders. */
  maxPages?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [pageCount, setPageCount] = useState(0);
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    if (!file) {
      setStatus("failed");
      setPageCount(0);
      setRendered(0);
      return;
    }

    let cancelled = false;
    const tasks: RenderTask[] = [];
    let pdfDoc: PDFDocumentProxy | null = null;
    setStatus("loading");
    setPageCount(0);
    setRendered(0);

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      host.replaceChildren();

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

        const total = Math.min(pdf.numPages, maxPages);
        setPageCount(pdf.numPages);
        const maxW = Math.max(280, host.clientWidth - 24);

        for (let i = 1; i <= total; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(maxW / base.width, 2);
          const viewport = page.getViewport({ scale });

          const wrap = document.createElement("div");
          wrap.className =
            "mx-auto w-full max-w-full overflow-hidden rounded-lg bg-white shadow-[0_8px_28px_rgba(26,31,28,0.1)]";
          wrap.style.width = `${Math.ceil(viewport.width)}px`;

          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.className = "block h-auto w-full";
          canvas.setAttribute("aria-label", `${title} — page ${i}`);

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          wrap.appendChild(canvas);
          host.appendChild(wrap);

          const task = page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          });
          tasks.push(task);
          await task.promise;
          if (!cancelled) setRendered(i);
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      for (const task of tasks) {
        try {
          task.cancel();
        } catch {
          /* ignore */
        }
      }
      void pdfDoc?.cleanup();
      if (hostRef.current) hostRef.current.replaceChildren();
    };
  }, [file, title, maxPages]);

  if (!file) return null;

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-200/60 dark:bg-zinc-950/70 ${className}`}
      role="region"
      aria-label={title}
    >
      {status === "failed" ? (
        <div className="flex min-h-[16rem] w-full items-center justify-center text-sm text-[color:var(--ink)]/50">
          PDF
        </div>
      ) : (
        <>
          {status === "loading" || rendered < pageCount ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-[color:var(--accent-soft)]">
              <div
                className="h-full bg-[color:var(--accent)] transition-[width] duration-200"
                style={{
                  width:
                    pageCount > 0
                      ? `${Math.round((rendered / Math.min(pageCount, maxPages)) * 100)}%`
                      : "15%",
                }}
              />
            </div>
          ) : null}
          <div
            ref={hostRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3"
          />
          {pageCount > 1 && status === "ready" ? (
            <p className="shrink-0 border-t border-[color:var(--line)]/60 px-3 py-1.5 text-center text-[11px] text-[color:var(--ink)]/45">
              {pageCount > maxPages
                ? `${maxPages}+ / ${pageCount}`
                : `${pageCount}`}{" "}
              pages
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

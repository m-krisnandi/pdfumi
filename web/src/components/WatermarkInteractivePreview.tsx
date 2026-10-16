"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

export type WatermarkPose = {
  /** 0–1 from left */
  x: number;
  /** 0–1 from top */
  y: number;
  /** degrees, CSS/PDF rotate */
  rotation: number;
};

export function WatermarkInteractivePreview({
  file,
  text,
  pose,
  onPoseChange,
  dragHint,
}: {
  file: File;
  text: string;
  pose: WatermarkPose;
  onPoseChange: (pose: WatermarkPose) => void;
  dragHint: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    setReady(false);
    setFailed(false);

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const raw = await file.arrayBuffer();
        const data = new Uint8Array(raw.slice(0));
        const pdf = await pdfjs.getDocument({ data, disableAutoFetch: true, disableStream: true }).promise;
        pdfDoc = pdf;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const maxW = stageRef.current?.clientWidth || 480;
        const scale = Math.min(1.2, maxW / base.width);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      void pdfDoc?.cleanup();
    };
  }, [file]);

  function clamp01(n: number) {
    return Math.min(0.95, Math.max(0.05, n));
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    onPoseChange({ ...pose, x, y });
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[color:var(--ink)]/55">{dragHint}</p>
      <div
        ref={stageRef}
        className="relative mx-auto w-full max-w-xl overflow-hidden rounded-xl bg-[#f7f4ee] shadow-[0_8px_24px_rgba(26,31,28,0.08)] ring-1 ring-black/5"
      >
        {failed ? (
          <div className="flex h-80 items-center justify-center text-sm text-[color:var(--ink)]/50">PDF</div>
        ) : (
          <>
            {!ready ? <div className="absolute inset-0 animate-pulse bg-[color:var(--accent-soft)]/50" /> : null}
            <canvas ref={canvasRef} className="block h-auto w-full" />
            {ready ? (
              <div
                role="slider"
                aria-label="Watermark position"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="absolute z-10 max-w-[90%] cursor-grab select-none px-2 py-1 text-center text-lg font-bold tracking-wide text-black/35 active:cursor-grabbing sm:text-2xl"
                style={{
                  left: `${pose.x * 100}%`,
                  top: `${pose.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${pose.rotation}deg)`,
                  textShadow: "0 0 1px rgba(255,255,255,0.4)",
                }}
              >
                {text.trim() || "Pdfumi"}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
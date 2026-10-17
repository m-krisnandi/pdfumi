"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

export type PlacedSignature = {
  dataUrl: string;
  /** center X 0–1 */
  x: number;
  /** center Y from top 0–1 */
  y: number;
  /** width as fraction of page width */
  width: number;
  /** 1-based page */
  page: number;
};

type Props = {
  file: File;
  page: number;
  pageCount: number;
  onPageCount: (n: number) => void;
  onPageChange: (page: number) => void;
  placement: PlacedSignature | null;
  onPlacementChange: (next: PlacedSignature | null) => void;
  /** Signature waiting to be stamped by click */
  stampSrc: string | null;
  onStampConsumed: () => void;
  labels: {
    placeHint: string;
    dragHint: string;
    deleteSig: string;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function SignPdfWorkspace({
  file,
  page,
  pageCount,
  onPageCount,
  onPageChange,
  placement,
  onPlacementChange,
  stampSrc,
  onStampConsumed,
  labels,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(true);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const dragMode = useRef<"move" | "resize" | null>(null);
  const dragStart = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const placementRef = useRef(placement);
  const onPlacementChangeRef = useRef(onPlacementChange);

  useEffect(() => {
    placementRef.current = placement;
    onPlacementChangeRef.current = onPlacementChange;
  }, [placement, onPlacementChange]);

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    setReady(false);
    setFailed(false);

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const raw = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(getPdfDocumentParams(raw)).promise;
        pdfDoc = pdf;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }
        onPageCount(pdf.numPages);
        const pageNo = Math.min(Math.max(1, page), pdf.numPages);
        const pdfPage = await pdf.getPage(pageNo);
        const base = pdfPage.getViewport({ scale: 1 });
        const maxW = stageRef.current?.clientWidth || 640;
        const scale = Math.min(1.35, maxW / base.width);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      void pdfDoc?.cleanup();
    };
  }, [file, page, onPageCount]);

  useEffect(() => {
    if (stampSrc) setGhost(null);
  }, [stampSrc]);

  function stagePoint(clientX: number, clientY: number) {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: clamp((clientX - rect.left) / rect.width, 0.04, 0.96),
      y: clamp((clientY - rect.top) / rect.height, 0.04, 0.96),
    };
  }

  function onStagePointerMove(e: React.PointerEvent) {
    if (stampSrc && !placement) {
      setGhost(stagePoint(e.clientX, e.clientY));
    }
  }

  function onStageClick(e: React.PointerEvent) {
    if (!stampSrc || placement) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-sig-chrome]")) return;
    const p = stagePoint(e.clientX, e.clientY);
    onPlacementChange({
      dataUrl: stampSrc,
      x: p.x,
      y: p.y,
      width: 0.28,
      page,
    });
    onStampConsumed();
    setGhost(null);
    setSelected(true);
  }

  function beginDrag(mode: "move" | "resize", e: React.PointerEvent) {
    const current = placementRef.current;
    if (!current) return;
    e.stopPropagation();
    e.preventDefault();
    setSelected(true);
    dragMode.current = mode;
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      x: current.x,
      y: current.y,
      width: current.width,
    };

    function onMove(ev: PointerEvent) {
      if (!dragMode.current || !dragStart.current || !stageRef.current) return;
      const live = placementRef.current;
      if (!live) return;
      const rect = stageRef.current.getBoundingClientRect();
      const dx = (ev.clientX - dragStart.current.px) / rect.width;
      const dy = (ev.clientY - dragStart.current.py) / rect.height;
      if (dragMode.current === "move") {
        onPlacementChangeRef.current({
          ...live,
          x: clamp(dragStart.current.x + dx, 0.06, 0.94),
          y: clamp(dragStart.current.y + dy, 0.06, 0.94),
        });
      } else {
        onPlacementChangeRef.current({
          ...live,
          width: clamp(dragStart.current.width + dx * 1.2, 0.1, 0.48),
        });
      }
    }

    function onUp() {
      dragMode.current = null;
      dragStart.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const placing = Boolean(stampSrc) && !placement;
  const showPlacement = placement && placement.page === page;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[color:var(--ink)]/55">
        {placing ? labels.placeHint : labels.dragHint}
      </p>
      <div
        ref={stageRef}
        className={`relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-[#ebe8e2] shadow-[0_12px_32px_rgba(26,31,28,0.1)] ring-1 ring-black/5 ${
          placing ? "cursor-none" : ""
        }`}
        onPointerMove={onStagePointerMove}
        onPointerDown={placing ? onStageClick : undefined}
      >
        {failed ? (
          <div className="flex h-80 items-center justify-center text-sm text-[color:var(--ink)]/50">PDF</div>
        ) : (
          <>
            {!ready ? <div className="absolute inset-0 animate-pulse bg-[color:var(--accent-soft)]/40" /> : null}
            <canvas ref={canvasRef} className="block h-auto w-full" />

            {placing && ghost && stampSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stampSrc}
                alt=""
                className="pointer-events-none absolute z-20 max-w-[28%] -translate-x-1/2 -translate-y-1/2 opacity-80 drop-shadow-md"
                style={{ left: `${ghost.x * 100}%`, top: `${ghost.y * 100}%` }}
              />
            ) : null}

            {showPlacement && placement ? (
              <div
                data-sig-chrome
                className="absolute z-10"
                style={{
                  left: `${placement.x * 100}%`,
                  top: `${placement.y * 100}%`,
                  width: `${placement.width * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`relative ${selected ? "ring-2 ring-[color:var(--accent)]" : "ring-1 ring-transparent hover:ring-[color:var(--accent)]/40"} rounded-sm`}
                  onPointerDown={(e) => beginDrag("move", e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(true);
                  }}
                  style={{ cursor: "grab" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={placement.dataUrl} alt="" className="block w-full select-none" draggable={false} />
                  {selected ? (
                    <>
                      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                        <span
                          key={corner}
                          data-sig-chrome
                          onPointerDown={(e) => beginDrag("resize", e)}
                          className={`absolute h-3 w-3 rounded-full bg-[color:var(--accent)] shadow ${
                            corner === "tl"
                              ? "-left-1.5 -top-1.5 cursor-nwse-resize"
                              : corner === "tr"
                                ? "-right-1.5 -top-1.5 cursor-nesw-resize"
                                : corner === "bl"
                                  ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                                  : "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                          }`}
                        />
                      ))}
                      <button
                        type="button"
                        data-sig-chrome
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlacementChange(null);
                        }}
                        className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-lg bg-[color:var(--accent)] px-2.5 py-1.5 text-[11px] !text-white shadow"
                        aria-label={labels.deleteSig}
                      >
                        ⌫
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-full border border-[color:var(--line)] px-3 py-1 disabled:opacity-40"
          >
            ‹
          </button>
          <span className="tabular-nums text-[color:var(--ink)]/60">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="rounded-full border border-[color:var(--line)] px-3 py-1 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

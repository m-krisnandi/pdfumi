"use client";

import { useEffect, useRef, useState } from "react";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfPageThumb } from "@/components/PdfPageThumb";
import { formatFileSize } from "@/components/PdfPreview";
import { OriginalPreviewModal } from "@/components/OriginalPreviewModal";
import { ThumbCardToolbar } from "@/components/ThumbCardToolbar";
import { normDeg } from "@/lib/fileRotate";

export type PageItem = {
  id: string;
  /** 1-based page number in the original PDF. */
  pageNumber: number;
  /** Extra clockwise rotation in 90° steps. */
  rotation?: number;
};

import { loadPdfJs, getPdfDocumentParams } from "@/lib/pdfjsLoader";

async function countPdfPages(file: File): Promise<number> {
  const pdfjs = await loadPdfJs();
  const raw = await file.arrayBuffer();
  const params = getPdfDocumentParams(raw);
  const pdf = await pdfjs.getDocument(params).promise;
  const n = pdf.numPages;
  await pdf.cleanup();
  return n;
}

export type PageMode = "reorder" | "select" | "view";

/**
 * Single-PDF workspace: page thumbnails with reorder and/or multi-select.
 */
export function PageWorkspace({
  file,
  onFile,
  pages,
  onPagesChange,
  selected,
  onSelectedChange,
  mode,
  allowReorder = false,
  rotationPreview = 0,
  maxPages = 500,
  defaultSelectAll = false,
  labels,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  pages: PageItem[];
  onPagesChange: (pages: PageItem[]) => void;
  selected?: Set<string>;
  onSelectedChange?: (selected: Set<string>) => void;
  mode: PageMode;
  allowReorder?: boolean;
  /** Visual rotation preview in degrees (e.g. while user clicks Rotate). */
  rotationPreview?: number;
  maxPages?: number;
  defaultSelectAll?: boolean;
  labels: {
    choose: string;
    drop: string;
    hint: string;
    replace: string;
    remove: string;
    reorderHint?: string;
    selectHint?: string;
    selectAll?: string;
    clearSelection?: string;
    loadingPages: string;
    tooManyPages?: (max: number) => string;
    preview?: string;
    closePreview?: string;
    rotate?: string;
    formatPages: (count: number) => string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);
  const [rangeInput, setRangeInput] = useState<string>("");
  const skipClickRef = useRef(false);

  function applyRange(input: string) {
    if (!onSelectedChange || pages.length === 0) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const pageMap = new Map<number, string>();
    pages.forEach((p) => pageMap.set(p.pageNumber, p.id));

    const selectedIds = new Set<string>();
    const parts = trimmed.split(/[,;\s]+/);

    for (const part of parts) {
      if (!part) continue;
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(pages.length, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            const id = pageMap.get(i);
            if (id) selectedIds.add(id);
          }
        }
      } else {
        const pageNo = parseInt(part, 10);
        if (!isNaN(pageNo)) {
          const id = pageMap.get(pageNo);
          if (id) selectedIds.add(id);
        }
      }
    }

    if (selectedIds.size > 0) {
      onSelectedChange(selectedIds);
    }
  }

  useEffect(() => {
    if (!file) {
      onPagesChange([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    countPdfPages(file)
      .then((count) => {
        if (cancelled) return;
        const capped = Math.min(count, maxPages);
        const list: PageItem[] = Array.from({ length: capped }, (_, i) => ({
          id: `p-${i + 1}-${crypto.randomUUID()}`,
          pageNumber: i + 1,
          rotation: 0,
        }));
        onPagesChange(list);
        if (defaultSelectAll && onSelectedChange) {
          onSelectedChange(new Set(list.map((p) => p.id)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file, maxPages, defaultSelectAll]); // eslint-disable-line react-hooks/exhaustive-deps

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    onFile(f);
  }

  function movePage(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = pages.findIndex((p) => p.id === fromId);
    const to = pages.findIndex((p) => p.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...pages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onPagesChange(next);
  }

  function rotatePage(id: string, delta: number) {
    onPagesChange(
      pages.map((p) =>
        p.id === id ? { ...p, rotation: normDeg((p.rotation ?? 0) + delta) } : p,
      ),
    );
  }

  function removePage(id: string) {
    onPagesChange(pages.filter((p) => p.id !== id));
    if (selected && onSelectedChange) {
      const next = new Set(selected);
      next.delete(id);
      onSelectedChange(next);
    }
  }

  function toggleSelect(id: string) {
    if (mode !== "select" || !onSelectedChange || !selected) return;
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  }

  if (!file) {
    return (
      <PdfDropzone
        labels={{ choose: labels.choose, drop: labels.drop, hint: labels.hint }}
        onFiles={takeFiles}
      />
    );
  }

  const canReorder = allowReorder || mode === "reorder";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 px-5 py-3.5 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300">{file.name}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {formatFileSize(file.size)}
            {pages.length ? ` · ${labels.formatPages(pages.length)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-xl glass-pill px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            {labels.replace}
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => takeFiles(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onFile(null);
              onPagesChange([]);
              onSelectedChange?.(new Set());
            }}
            className="rounded-xl glass-pill px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            {labels.remove}
          </button>
        </div>
      </div>

      {mode === "reorder" && labels.reorderHint ? (
        <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">{labels.reorderHint}</p>
      ) : null}
      {mode === "select" && (
        <div className="space-y-3 p-4 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {labels.selectHint || "Pilih halaman yang ingin disimpan atau dipisah"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Terpilih: <strong className="text-teal-600 dark:text-teal-400">{selected?.size ?? 0}</strong> dari {pages.length} halaman
              </p>
            </div>
            {onSelectedChange && pages.length > 0 ? (
              <div className="flex items-center gap-2">
                {labels.selectAll ? (
                  <button
                    type="button"
                    onClick={() => onSelectedChange(new Set(pages.map((p) => p.id)))}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 glass-pill hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    {labels.selectAll}
                  </button>
                ) : null}
                {labels.clearSelection ? (
                  <button
                    type="button"
                    onClick={() => onSelectedChange(new Set())}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 dark:text-zinc-400 glass-pill hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                  >
                    {labels.clearSelection}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {pages.length > 1 && onSelectedChange && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5 text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">Pilih Rentang Halaman:</span>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[220px]">
                <input
                  type="text"
                  placeholder="Contoh: 1-80 atau 1-10, 15, 20-30"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyRange(rangeInput);
                    }
                  }}
                  className="glass-input px-3.5 py-1.5 rounded-xl text-xs w-full sm:w-64 font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={() => applyRange(rangeInput)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition shrink-0 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Shortcut:</span>
                {pages.length >= 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.ceil(pages.length / 2);
                      setRangeInput(`1-${half}`);
                      applyRange(`1-${half}`);
                    }}
                    className="underline hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer font-medium"
                  >
                    Hal 1-{Math.ceil(pages.length / 2)}
                  </button>
                )}
                {pages.length >= 80 && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRangeInput("1-80");
                        applyRange("1-80");
                      }}
                      className="underline hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer font-bold text-teal-600 dark:text-teal-400"
                    >
                      Hal 1-80
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{labels.loadingPages}</p>
      ) : (
        <div className="flex flex-wrap items-start gap-5 sm:gap-6">
          {pages.map((page, index) => {
            const isSelected = mode !== "select" || (selected?.has(page.id) ?? false);
            const rot = normDeg((page.rotation ?? 0) + rotationPreview);
            return (
              <article
                key={page.id}
                draggable={canReorder}
                onDragStart={() => {
                  if (!canReorder) return;
                  setDragId(page.id);
                }}
                onDragOver={(e) => {
                  if (!canReorder || !dragId) return;
                  e.preventDefault();
                  setOverId(page.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!canReorder || !dragId) return;
                  movePage(dragId, page.id);
                  setDragId(null);
                  setOverId(null);
                }}
                onDragEnd={() => {
                  if (dragId) skipClickRef.current = true;
                  setDragId(null);
                  setOverId(null);
                }}
                onClick={() => toggleSelect(page.id)}
                className={`group w-[7.25rem] transition hover:z-20 sm:w-36 ${
                  mode === "select" && canReorder
                    ? "cursor-grab active:cursor-grabbing"
                    : mode === "select"
                      ? "cursor-pointer"
                      : canReorder
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                } ${dragId === page.id ? "scale-95 opacity-40" : ""} ${
                  mode === "select" && !selected?.has(page.id) ? "opacity-50" : ""
                }`}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border bg-white/80 dark:bg-zinc-900/80 shadow-md transition-all ${
                    mode === "select" && selected?.has(page.id)
                      ? "border-teal-500 ring-2 ring-teal-500"
                      : "border-zinc-200/80 dark:border-white/10"
                  } ${
                    overId === page.id && dragId !== page.id
                      ? "border-teal-500 ring-2 ring-teal-500"
                      : ""
                  }`}
                >
                  <span className="absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-lg bg-black/75 px-1.5 text-[10px] font-bold !text-white shadow">
                    {index + 1}
                  </span>
                  {mode === "select" ? (
                    <span
                      className={`absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow ${
                        isSelected
                          ? "bg-teal-600 !text-white shadow-md"
                          : "glass-pill text-zinc-400"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  ) : null}
                  <PdfPageThumb
                    file={file}
                    pageNumber={page.pageNumber}
                    className="pointer-events-none aspect-[3/4] w-full"
                    rotation={rot}
                  />
                  <ThumbCardToolbar
                    previewLabel={labels.preview ?? "Preview"}
                    rotateLabel={labels.rotate ?? "Rotate"}
                    removeLabel={labels.remove}
                    onPreview={() => setPreviewPage(page)}
                    onRotate={() => rotatePage(page.id, 90)}
                    onRemove={() => removePage(page.id)}
                  />
                </div>
                <p className="mt-1.5 truncate text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  #{page.pageNumber}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <OriginalPreviewModal
        target={
          previewPage && file
            ? {
                kind: "pdf-page",
                file,
                pageNumber: previewPage.pageNumber,
                title: `${file.name} · #${previewPage.pageNumber}`,
                rotation: normDeg((previewPage.rotation ?? 0) + rotationPreview),
              }
            : null
        }
        onClose={() => setPreviewPage(null)}
        closeLabel={labels.closePreview ?? "Close"}
      />
    </div>
  );
}

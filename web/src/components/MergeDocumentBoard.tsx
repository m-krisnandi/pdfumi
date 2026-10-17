"use client";

import { useCallback, useId, useRef, useState } from "react";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { PdfDropzone } from "@/components/PdfDropzone";
import { formatFileSize } from "@/components/PdfPreview";
import { OriginalPreviewModal } from "@/components/OriginalPreviewModal";
import { ThumbCardToolbar } from "@/components/ThumbCardToolbar";
import { normDeg } from "@/lib/fileRotate";
import { Plus } from "lucide-react";

export type MergeDoc = {
  id: string;
  file: File;
  rotation?: number;
};

export function createMergeDocs(list: FileList | File[]): MergeDoc[] {
  return Array.from(list)
    .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    .map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      rotation: 0,
    }));
}

const CARD = "w-[7.25rem] sm:w-36";
const THUMB = "aspect-[3/4] w-full";

export function MergeDocumentBoard({
  docs,
  maxFiles = 20,
  onChange,
  labels,
}: {
  docs: MergeDoc[];
  maxFiles?: number;
  onChange: (docs: MergeDoc[]) => void;
  /** @deprecated cards are always compact */
  layout?: "row" | "column";
  labels: {
    choose: string;
    drop: string;
    hint: string;
    addMore: string;
    remove: string;
    reorderHint: string;
    preview?: string;
    closePreview?: string;
    rotate?: string;
    formatPages: (count: number) => string;
  };
}) {
  const addInputId = useId();
  const addInputRef = useRef<HTMLInputElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewDoc = previewId ? docs.find((d) => d.id === previewId) : null;

  function takeFiles(list: FileList | null) {
    if (!list?.length) return;
    const incoming = createMergeDocs(list);
    if (!incoming.length) return;
    onChange([...docs, ...incoming].slice(0, maxFiles));
    if (addInputRef.current) addInputRef.current.value = "";
  }

  function removeDoc(id: string) {
    onChange(docs.filter((d) => d.id !== id));
  }

  function rotateDoc(id: string, delta: number) {
    onChange(
      docs.map((d) =>
        d.id === id ? { ...d, rotation: normDeg((d.rotation ?? 0) + delta) } : d,
      ),
    );
  }

  function moveDoc(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = docs.findIndex((d) => d.id === fromId);
    const to = docs.findIndex((d) => d.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...docs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  const setCount = useCallback((id: string, count: number) => {
    setPageCounts((prev) => (prev[id] === count ? prev : { ...prev, [id]: count }));
  }, []);

  if (docs.length === 0) {
    return (
      <PdfDropzone
        multiple
        labels={{ choose: labels.choose, drop: labels.drop, hint: labels.hint }}
        onFiles={takeFiles}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">{labels.reorderHint}</p>

      <div className="flex flex-wrap items-start gap-5 sm:gap-6">
        {docs.map((doc, index) => {
          const rot = doc.rotation ?? 0;
          return (
            <article
              key={doc.id}
              draggable
              onDragStart={() => setDragId(doc.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(doc.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragId) return;
                moveDoc(dragId, doc.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`group ${CARD} cursor-grab transition active:cursor-grabbing ${
                dragId === doc.id ? "scale-95 opacity-40" : ""
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-md ${
                  overId === doc.id && dragId !== doc.id
                    ? "ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-zinc-900"
                    : ""
                }`}
              >
                <span className="absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-lg bg-black/75 px-1.5 text-[10px] font-bold !text-white shadow">
                  {index + 1}
                </span>
                <div
                  className={THUMB}
                  style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
                >
                  <PdfDocumentThumb
                    file={doc.file}
                    className={`pointer-events-none ${THUMB}`}
                    onPageCount={(count) => setCount(doc.id, count)}
                  />
                </div>
                <ThumbCardToolbar
                  previewLabel={labels.preview ?? "Preview"}
                  rotateLabel={labels.rotate ?? "Rotate"}
                  removeLabel={labels.remove}
                  onPreview={() => setPreviewId(doc.id)}
                  onRotate={() => rotateDoc(doc.id, 90)}
                  onRemove={() => removeDoc(doc.id)}
                />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="truncate rounded-lg bg-teal-500/15 dark:bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                  {doc.file.name}
                </p>
                <p className="px-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {formatFileSize(doc.file.size)}
                  {pageCounts[doc.id] != null ? ` · ${labels.formatPages(pageCounts[doc.id])}` : ""}
                </p>
              </div>
            </article>
          );
        })}

        {docs.length < maxFiles ? (
          <label
            htmlFor={addInputId}
            className={`flex ${CARD} ${THUMB} cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300/80 dark:border-white/15 bg-white/40 dark:bg-white/[0.03] text-center transition-all hover:border-teal-500 hover:bg-teal-500/[0.05] hover:scale-105 shadow-inner`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 dark:bg-teal-500 text-white dark:text-zinc-950 shadow-md">
              <Plus className="w-5 h-5" />
            </span>
            <span className="px-2 text-[10px] font-bold text-teal-700 dark:text-teal-300">{labels.addMore}</span>
            <input
              ref={addInputRef}
              id={addInputId}
              type="file"
              accept="application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => takeFiles(e.target.files)}
            />
          </label>
        ) : null}
      </div>

      <OriginalPreviewModal
        target={
          previewDoc
            ? {
                kind: "pdf-page",
                file: previewDoc.file,
                pageNumber: 1,
                title: previewDoc.file.name,
                rotation: previewDoc.rotation ?? 0,
              }
            : null
        }
        onClose={() => setPreviewId(null)}
        closeLabel={labels.closePreview ?? "Close"}
      />
    </div>
  );
}

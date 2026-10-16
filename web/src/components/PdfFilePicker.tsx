"use client";

import { useState } from "react";
import { PdfDropzone } from "@/components/PdfDropzone";
import { formatFileSize } from "@/components/PdfPreview";

export function PdfFilePicker({
  multiple = false,
  maxFiles = 3,
  files,
  onChange,
  reorderable = false,
  labels,
}: {
  multiple?: boolean;
  maxFiles?: number;
  files: File[];
  onChange: (files: File[]) => void;
  reorderable?: boolean;
  labels: {
    choose: string;
    drop: string;
    hint: string;
    remove: string;
    selected: string;
    reorderHint?: string;
  };
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function takeFiles(list: FileList | null) {
    if (!list?.length) return;
    const pdfs = Array.from(list).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!pdfs.length) return;
    const next = multiple ? [...files, ...pdfs].slice(0, maxFiles) : pdfs.slice(0, 1);
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= files.length || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  if (files.length === 0) {
    return (
      <PdfDropzone
        multiple={multiple}
        labels={{ choose: labels.choose, drop: labels.drop, hint: labels.hint }}
        onFiles={takeFiles}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
          {labels.selected} ({files.length}
          {multiple ? `/${maxFiles}` : ""})
        </p>
        {reorderable && labels.reorderHint ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.reorderHint}</p>
        ) : null}
      </div>
      <ul className="space-y-2.5">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            draggable={reorderable}
            onDragStart={() => {
              if (!reorderable) return;
              setDragIndex(index);
            }}
            onDragOver={(e) => {
              if (!reorderable || dragIndex === null) return;
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!reorderable || dragIndex === null) return;
              moveItem(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`flex items-center justify-between gap-3 rounded-2xl glass-card border p-3 sm:p-3.5 text-sm transition-all ${
              reorderable ? "cursor-grab active:cursor-grabbing" : ""
            } ${
              overIndex === index && dragIndex !== index
                ? "border-teal-500 bg-teal-500/15"
                : "border-zinc-200/80 dark:border-white/10"
            } ${dragIndex === index ? "opacity-50" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {reorderable ? (
                <span
                  aria-hidden
                  className="select-none text-zinc-400"
                  title={labels.reorderHint}
                >
                  ⋮⋮
                </span>
              ) : null}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">{file.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="shrink-0 glass-pill rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              {labels.remove}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

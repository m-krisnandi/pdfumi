"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export function PdfDropzone({
  multiple = false,
  accept = "application/pdf",
  labels,
  onFiles,
  className = "",
}: {
  multiple?: boolean;
  accept?: string;
  labels: {
    choose: string;
    drop: string;
    hint: string;
  };
  onFiles: (files: FileList | null) => void;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    onFiles(list);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <label
      htmlFor={inputId}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`group flex w-full min-h-64 sm:min-h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all overflow-hidden ${
        dragging
          ? "border-teal-500 bg-teal-500/15 scale-[1.01]"
          : "border-zinc-300/80 dark:border-white/15 bg-white/40 dark:bg-white/[0.03] hover:border-teal-500 hover:bg-teal-500/[0.05] hover:scale-[1.005]"
      } backdrop-blur-md shadow-inner ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 shadow-sm group-hover:scale-110 transition-transform">
        <UploadCloud className="w-7 h-7" />
      </div>
      <span className="rounded-2xl bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 px-7 py-3.5 text-xs sm:text-sm font-bold text-white dark:text-zinc-950 transition-all shadow-md group-hover:shadow-lg group-hover:scale-105 active:scale-95">
        {labels.choose}
      </span>
      <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {labels.drop}
      </span>
      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 max-w-sm">
        {labels.hint}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
}

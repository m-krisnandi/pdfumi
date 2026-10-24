"use client";

import { useEffect, useState } from "react";

export function ImageFileThumb({
  file,
  className = "h-56 w-44",
}: {
  file: File;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setFailed(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 ${className}`}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="text-xs font-semibold text-[color:var(--ink)]/55">IMAGE</span>
          <span className="max-w-full truncate text-[10px] text-[color:var(--ink)]/40">{file.name}</span>
        </div>
      )}
    </div>
  );
}

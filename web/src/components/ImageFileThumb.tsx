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

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="h-full w-full object-contain" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-[color:var(--accent-soft)]/60" />
      )}
    </div>
  );
}

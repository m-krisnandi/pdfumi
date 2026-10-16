"use client";

/** Page/file card actions — sits inside the thumb so it never overlaps neighbors. */
export function ThumbCardToolbar({
  previewLabel,
  rotateLabel,
  removeLabel,
  onPreview,
  onRotate,
  onRemove,
}: {
  previewLabel: string;
  rotateLabel: string;
  removeLabel: string;
  onPreview: () => void;
  onRotate: () => void;
  onRemove: () => void;
}) {
  const buttons = (
    <>
      <IconBtn label={previewLabel} onClick={onPreview}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </IconBtn>
      <IconBtn label={rotateLabel} onClick={onRotate}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M17 8h3a8 8 0 1 1-8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconBtn>
      <IconBtn label={removeLabel} onClick={onRemove} danger>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </IconBtn>
    </>
  );

  return (
    <>
      {/* Desktop: bottom overlay inside thumb — hover only */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1 pb-1.5 pt-8 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 sm:block"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1 rounded-xl glass-pill p-1 shadow-lg">
          {buttons}
        </div>
      </div>

      {/* Mobile: actions under the thumb (no hover) */}
      <div
        className="mt-1.5 flex items-center justify-center gap-1 sm:hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {buttons}
      </div>
    </>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-teal-500/15 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer ${
        danger ? "hover:!bg-red-500/15 hover:!text-red-600 dark:hover:!text-red-400" : ""
      }`}
    >
      {children}
    </button>
  );
}

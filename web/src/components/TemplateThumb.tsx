"use client";

import { cn } from "@/lib/cn";

type TemplateId = "classic" | "modern" | "elegant";

export function TemplateThumb({
  id,
  selected,
  title,
  description,
  onSelect,
}: {
  id: TemplateId;
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "overflow-hidden rounded-2xl border text-left transition-all cursor-pointer",
        selected
          ? "border-teal-500 bg-teal-500/15 ring-2 ring-teal-500"
          : "border-zinc-200/80 dark:border-white/10 glass-card hover:border-teal-500/60",
      )}
    >
      <div className="border-b border-zinc-200/60 dark:border-white/10 bg-zinc-100/70 dark:bg-zinc-900/70 px-2.5 pt-2.5 pb-2">
        <MiniCert id={id} />
      </div>
      <div className="px-3.5 py-3">
        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </button>
  );
}

function MiniCert({ id }: { id: TemplateId }) {
  if (id === "modern") {
    return (
      <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-teal-500" />
        <div className="absolute inset-x-0 top-0 h-3 bg-teal-500/15" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-teal-500" />
        <div className="absolute left-3 right-4 top-5 space-y-1.5">
          <div className="h-1 w-10 rounded bg-teal-500/50" />
          <div className="h-1.5 w-16 rounded bg-zinc-400/30" />
          <div className="h-2.5 w-20 rounded bg-zinc-700/60 dark:bg-zinc-300/60" />
          <div className="h-1 w-14 rounded bg-zinc-400/20" />
          <div className="mt-1 h-0.5 w-8 bg-teal-500" />
          <div className="h-1.5 w-16 rounded bg-zinc-400/40" />
        </div>
      </div>
    );
  }

  if (id === "elegant") {
    return (
      <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl border border-[#c4a574]/50 bg-[#fcf8f0] dark:bg-amber-950/20 shadow-sm">
        <div className="absolute inset-x-6 top-3 flex flex-col items-center gap-1">
          <div className="h-1.5 w-16 rounded bg-[#8c6937]/70" />
          <div className="flex items-center gap-1">
            <div className="h-px w-6 bg-[#8c6937]/50" />
            <div className="h-1 w-1 rotate-45 bg-[#8c6937]" />
            <div className="h-px w-6 bg-[#8c6937]/50" />
          </div>
          <div className="mt-1 h-1 w-12 rounded bg-[#8c6937]/35" />
          <div className="h-2.5 w-18 rounded bg-[#30241c]/75 dark:bg-amber-200/70" style={{ width: "4.5rem" }} />
          <div className="h-1 w-10 rounded bg-[#8c6937]/30" />
          <div className="h-1.5 w-14 rounded bg-[#30241c]/50 dark:bg-amber-200/50" />
        </div>
      </div>
    );
  }

  // classic
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
      <div className="absolute inset-1 rounded-[2px] border-2 border-[#aa8c46]" />
      <div className="absolute inset-2 rounded-[1px] border border-[#aa8c46]/70" />
      <div className="absolute left-2 top-2 h-2 w-2 border-l border-t border-[#aa8c46]" />
      <div className="absolute right-2 top-2 h-2 w-2 border-r border-t border-[#aa8c46]" />
      <div className="absolute bottom-2 left-2 h-2 w-2 border-b border-l border-[#aa8c46]" />
      <div className="absolute bottom-2 right-2 h-2 w-2 border-b border-r border-[#aa8c46]" />
      <div className="absolute inset-x-4 top-4 flex flex-col items-center gap-1">
        <div className="h-1 w-12 rounded bg-[#aa8c46]/55" />
        <div className="h-px w-10 bg-[#aa8c46]/40" />
        <div className="mt-1 h-1 w-14 rounded bg-zinc-400/30" />
        <div className="h-2.5 w-18 rounded bg-zinc-700/70 dark:bg-zinc-200/70" style={{ width: "4.5rem" }} />
        <div className="h-1 w-10 rounded bg-zinc-400/20" />
        <div className="h-1.5 w-14 rounded bg-zinc-400/45" />
      </div>
    </div>
  );
}

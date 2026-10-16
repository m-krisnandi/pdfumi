"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MEGA_MENU_COLUMNS, TONE_CLASS } from "@/lib/toolsCatalog";
import { ChevronDown, X } from "lucide-react";

export function ToolsMegaMenu() {
  const t = useTranslations("toolsMenu");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Tools trigger button in header */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`relative z-[80] inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
          open
            ? "bg-teal-600/15 text-teal-600 dark:text-teal-400 shadow-xs"
            : "text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10"
        }`}
      >
        <span className="grid grid-cols-2 gap-0.5" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
        </span>
        <span>{t("label")}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <>
          {/* Backdrop Overlay */}
          <div
            aria-hidden
            className="fixed inset-0 top-[72px] sm:top-[80px] z-[60] bg-black/35 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setOpen(false)}
          />

          {/* Full-width Smallpdf-style Mega Menu Dropdown Banner */}
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="fixed left-0 right-0 top-[72px] sm:top-[80px] z-[65] w-full border-b border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto lg:overflow-visible"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
              {/* Header Title & Close Bar */}
              <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-white/10 pb-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {t("title")}
                  </span>
                  <span className="hidden sm:inline-block text-xs text-zinc-500 dark:text-zinc-400">
                    {t("subtitle")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={t("close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 6 Balanced Columns Grid: Zero scroll on desktop, everything immediately visible! */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-5">
                {MEGA_MENU_COLUMNS.map((col) => (
                  <div key={col.id} className="min-w-0 space-y-4">
                    {col.sections.map((sec) => (
                      <section key={sec.id} className="min-w-0 space-y-1">
                        <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 px-2 pb-0.5">
                          {t(`groups.${sec.id}`)}
                        </h3>
                        <ul className="space-y-0.5">
                          {sec.tools.map((tool) => {
                            const label = t(`items.${tool.id}`);
                            const Icon = tool.icon;
                            const chip = (
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md shadow-2xs transition-transform group-hover:scale-110 ${TONE_CLASS[tool.tone]}`}
                              >
                                <Icon className="w-3 h-3" />
                              </span>
                            );

                            if (tool.status === "soon" || !tool.href) {
                              return (
                                <li key={tool.id}>
                                  <span className="flex items-center gap-2 rounded-lg px-2 py-1 opacity-50 cursor-not-allowed">
                                    {chip}
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                      {label}
                                    </span>
                                    <span className="shrink-0 rounded-full px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-200 dark:bg-white/10">
                                      {tCommon("soon")}
                                    </span>
                                  </span>
                                </li>
                              );
                            }

                            return (
                              <li key={tool.id}>
                                <Link
                                  href={tool.href}
                                  onClick={() => setOpen(false)}
                                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all text-zinc-800 dark:text-zinc-200 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 group cursor-pointer"
                                >
                                  {chip}
                                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight group-hover:translate-x-0.5 transition-transform">
                                    {label}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

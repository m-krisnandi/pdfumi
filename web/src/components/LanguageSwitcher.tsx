"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { Globe, ChevronDown, Check } from "lucide-react";

const COOKIE = "NEXT_LOCALE";

function persistLocale(locale: Locale) {
  document.cookie = `${COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchLocale(next: Locale) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    persistLocale(next);
    router.replace(pathname, { locale: next });
    setOpen(false);
  }

  const currentLabel = localeLabels[locale] || localeLabels.en;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
        className={`glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/80 dark:border-white/10 ${
          open
            ? "text-teal-600 dark:text-teal-400 ring-2 ring-teal-500/20"
            : "text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:scale-105 active:scale-95"
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 dark:text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language")}
          className="absolute right-0 top-full mt-2 z-[70] min-w-[9.5rem] rounded-2xl bg-white dark:bg-[#0f172a] p-1.5 shadow-2xl shadow-black/25 dark:shadow-black/80 border border-zinc-200 dark:border-zinc-700/80 ring-1 ring-black/5 dark:ring-white/10 animate-in zoom-in-95 duration-150 space-y-0.5"
        >
          {locales.map((code) => {
            const isSelected = code === locale;
            return (
              <button
                key={code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => switchLocale(code)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                <span>{localeLabels[code]}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

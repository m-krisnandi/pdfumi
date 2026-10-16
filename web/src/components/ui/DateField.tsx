"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  addMonths,
  calendarGrid,
  formatLongDate,
  formatMonthYear,
  isSameDay,
  startOfDay,
  weekdayLabels,
} from "@/lib/dates";
import { cn } from "@/lib/cn";

type PanelPos = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

export function DateField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [view, setView] = useState(() => startOfDay(value ?? new Date()));

  const display = value ? formatLongDate(locale, value) : "";
  const weekdays = weekdayLabels(locale);
  const cells = calendarGrid(view);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (value) setView(startOfDay(new Date(value.getFullYear(), value.getMonth(), 1)));
  }, [value]);

  function updatePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const estimatedHeight = panelRef.current?.offsetHeight || 300;
    const width = Math.min(Math.max(rect.width, 280), 320);
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < estimatedHeight && spaceAbove >= spaceBelow;

    let top = openUp ? rect.top - gap - estimatedHeight : rect.bottom + gap;
    top = Math.max(8, Math.min(top, window.innerHeight - estimatedHeight - 8));

    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    setPos({ top, left, width, openUp });
  }

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePosition();
    // Second pass after paint so real panel height is known
    const id = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(id);
  }, [open, view]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      updatePosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function selectDay(day: Date) {
    onChange(startOfDay(day));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative block text-sm">
      <span className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
      {name ? <input type="hidden" name={name} value={display} required={required} /> : null}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl glass-input px-3.5 py-2.5 text-left outline-none transition cursor-pointer",
          open
            ? "ring-2 ring-teal-500/30 border-teal-500"
            : "hover:border-teal-500/60",
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
          <CalendarIcon />
        </span>
        <span
          className={cn(
            "flex-1 truncate text-xs sm:text-sm font-medium",
            display ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500",
          )}
        >
          {display || placeholder || formatLongDate(locale, today)}
        </span>
        <span className="text-zinc-400" aria-hidden>
          <ChevronIcon down={!open} />
        </span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={label}
          style={
            pos
              ? {
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                }
              : { position: "fixed", visibility: "hidden" }
          }
          className={cn(
            "z-50 rounded-3xl glass-panel p-4 shadow-2xl animate-in zoom-in-95 duration-150",
            pos?.openUp
              ? "origin-bottom animate-[datePopUp_140ms_ease-out]"
              : "origin-top animate-[datePop_140ms_ease-out]",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView((v) => addMonths(v, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
            >
              <ChevronIcon left />
            </button>
            <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatMonthYear(locale, view)}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
            >
              <ChevronIcon right />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {weekdays.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-8" />;
              const selected = value ? isSameDay(day, value) : false;
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "relative flex h-8 items-center justify-center rounded-xl text-xs font-medium transition cursor-pointer",
                    selected
                      ? "bg-teal-600 font-bold !text-white shadow-sm"
                      : "text-zinc-800 dark:text-zinc-200 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400",
                    isToday && !selected && "font-bold text-teal-600 dark:text-teal-400",
                  )}
                >
                  {day.getDate()}
                  {isToday && !selected ? (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal-500" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-zinc-200/60 dark:border-white/10 pt-2.5">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="rounded-xl px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              {tCommon("clear")}
            </button>
            <button
              type="button"
              onClick={() => selectDay(today)}
              className="rounded-xl px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer"
            >
              {tCommon("today")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ down, left, right }: { down?: boolean; left?: boolean; right?: boolean }) {
  if (left) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (right) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("transition-transform", down && "rotate-180")}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

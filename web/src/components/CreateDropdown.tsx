"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ReceiptText,
  Receipt,
  Award,
  ScrollText,
  FileCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export function CreateDropdown() {
  const t = useTranslations("toolsMenu");
  const locale = useLocale();
  const isId = locale === "id";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const items = [
    {
      href: "/tools/kwitansi",
      label: t("items.receipt"),
      desc: isId
        ? "Kwitansi pembayaran tanda terima resmi"
        : "Professional receipts with spelled-out amount",
      icon: ReceiptText,
      tone: "bg-[#2f9e6b] text-white",
    },
    {
      href: "/tools/invoice",
      label: t("items.invoice"),
      desc: isId
        ? "Tagihan invoice komersial profesional"
        : "Itemized commercial billing invoices",
      icon: Receipt,
      tone: "bg-[#2a9d8f] text-white",
    },
    {
      href: "/tools/sertifikat",
      label: t("items.certificates"),
      desc: isId
        ? "Sertifikat penghargaan & webinar"
        : "Elegant webinar & completion certificates",
      icon: Award,
      tone: "bg-[#e8a838] text-white",
    },
    {
      href: "/tools/surat",
      label: t("items.suratResmi"),
      desc: isId
        ? "Format surat dinas dan instansi resmi"
        : "Standard formal letters with header",
      icon: ScrollText,
      tone: "bg-[#3b6fd9] text-white",
    },
    {
      href: "/tools/kontrak",
      label: t("items.kontrak"),
      desc: isId
        ? "Surat perjanjian kerja sama & MoU"
        : "Customizable employment contracts & NDAs",
      icon: FileCheck,
      tone: "bg-[#7b5ea7] text-white",
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
          open
            ? "text-teal-600 dark:text-teal-400 bg-teal-500/15 ring-1 ring-teal-500/30"
            : "text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10"
        }`}
      >
        <span>{t("groups.create")}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 origin-top-left rounded-2xl bg-white dark:bg-[#0f172a] p-2 shadow-2xl shadow-black/25 dark:shadow-black/80 border border-zinc-200 dark:border-zinc-700/80 animate-in fade-in zoom-in-95 duration-150 z-[70] ring-1 ring-black/5 dark:ring-white/10">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isId ? "Dokumen Resmi Siap Pakai" : "Official Document Makers"}
            </span>
            <span className="text-[10px] text-zinc-400">PDF Generator</span>
          </div>
          <div className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl p-2.5 transition text-zinc-900 dark:text-zinc-100 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 group cursor-pointer"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs mt-0.5 transition-transform group-hover:scale-105 ${item.tone}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

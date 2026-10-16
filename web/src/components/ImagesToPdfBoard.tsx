"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { imagesToPdfClient } from "@/lib/pdfLibUtils";
import { formatFileSize } from "@/components/PdfPreview";
import { ArrowUp, ArrowDown, Trash2, Download, Image as ImageIcon, Plus } from "lucide-react";

type ImageEntry = {
  id: string;
  file: File;
  previewUrl: string;
};

export function ImagesToPdfBoard({
  acceptedType = "image/*",
  titleKey = "jpgToPdf",
}: {
  acceptedType?: string;
  titleKey?: string;
}) {
  const t = useTranslations(titleKey);
  const tCommon = useTranslations("common");

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<"none" | "small" | "standard">("small");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const newEntries: ImageEntry[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (f.type.startsWith("image/") || /\.(heic|heif|png|jpg|jpeg|webp)$/i.test(f.name)) {
        newEntries.push({
          id: Math.random().toString(36).slice(2),
          file: f,
          previewUrl: URL.createObjectURL(f),
        });
      }
    }
    setImages((prev) => [...prev, ...newEntries]);
    setError(null);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }

  function remove(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleConvert() {
    if (images.length === 0) {
      setError(t("needFiles"));
      return;
    }
    setProcessing(true);
    setError(null);

    try {
      const blob = await imagesToPdfClient(
        images.map((img) => ({ file: img.file, orientation })),
        margin
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dokumen-gambar.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengonversi gambar ke PDF");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      {images.length === 0 ? (
        <PdfDropzone
          multiple
          accept={acceptedType}
          labels={{
            choose: t("chooseFiles"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={addFiles}
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {images.length} Gambar Dipilih
              </span>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 text-xs font-semibold cursor-pointer hover:bg-teal-500/20 transition">
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Foto Lagi</span>
                <input
                  type="file"
                  multiple
                  accept={acceptedType}
                  className="sr-only"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setImages([])}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              Hapus Semua
            </button>
          </div>

          {/* Options Palette */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-white/10">
            <div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Orientasi Halaman:
              </span>
              <div className="flex items-center gap-1.5">
                {(["auto", "portrait", "landscape"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrientation(o)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition ${
                      orientation === o
                        ? "bg-teal-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Margin Tepi:
              </span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: "none", label: "Tanpa Margin" },
                    { id: "small", label: "Kecil" },
                    { id: "standard", label: "Standar" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMargin(m.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      margin === m.id
                        ? "bg-teal-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Grid with Reorder */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((item, idx) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-800 p-2 shadow-xs transition hover:shadow-md"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    #{idx + 1}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <p className="truncate text-zinc-700 dark:text-zinc-300 max-w-[90px] text-[11px]">
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => move(idx, -1)}
                      className="p-1 rounded text-zinc-400 hover:text-teal-600 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => move(idx, 1)}
                      className="p-1 rounded text-zinc-400 hover:text-teal-600 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="p-1 rounded text-zinc-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ErrorBanner message={error} />

          <Button
            type="button"
            loading={processing}
            onClick={handleConvert}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Gabungkan Jadi PDF</span>
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

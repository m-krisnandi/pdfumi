"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { Download, RefreshCw, ZoomIn, ZoomOut, Check } from "lucide-react";

type PasFotoPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  desc: string;
};

const PRESETS: PasFotoPreset[] = [
  { id: "3x4", name: "3 × 4 cm", width: 354, height: 472, desc: "Standar Ijazah, CPNS, Lamaran Kerja" },
  { id: "4x6", name: "4 × 6 cm", width: 472, height: 709, desc: "Standar SKCK, Pernikahan, Kedinasan" },
  { id: "2x3", name: "2 × 3 cm", width: 236, height: 354, desc: "Kartu Tanda Anggota, SIM, KTP" },
  { id: "paspor", name: "Paspor (2 × 2\")", width: 600, height: 600, desc: "Visa & Paspor Internasional" },
];

const BG_COLORS = [
  { id: "red", name: "Merah (#D32F2F)", hex: "#D32F2F", note: "Tahun Lahir Ganjil" },
  { id: "blue", name: "Biru (#1976D2)", hex: "#1976D2", note: "Tahun Lahir Genap" },
  { id: "white", name: "Putih (#FFFFFF)", hex: "#FFFFFF", note: "Visa / Internasional" },
  { id: "none", name: "Warna Asli", hex: "transparent", note: "Tanpa ganti background" },
];

export function PasFotoBoard() {
  const t = useTranslations("pasFoto");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PasFotoPreset>(PRESETS[0]);
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [scale, setScale] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    setScale(1.0);
    setOffsetX(0);
    setOffsetY(0);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Live Canvas Render
  useEffect(() => {
    if (!previewSrc || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = selectedPreset.width;
      canvas.height = selectedPreset.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw Background color if selected
      if (selectedBg.hex !== "transparent") {
        ctx.fillStyle = selectedBg.hex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Compute proportional draw position
      const imgRatio = img.width / img.height;
      const targetRatio = canvas.width / canvas.height;

      let drawW, drawH;
      if (imgRatio > targetRatio) {
        drawH = canvas.height * scale;
        drawW = drawH * imgRatio;
      } else {
        drawW = canvas.width * scale;
        drawH = drawW / imgRatio;
      }

      const drawX = (canvas.width - drawW) / 2 + offsetX;
      const drawY = (canvas.height - drawH) / 2 + offsetY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };
    img.src = previewSrc;
  }, [previewSrc, selectedPreset, selectedBg, scale, offsetX, offsetY]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    setProcessing(true);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Gagal membuat pas foto");
          setProcessing(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pasfoto-${selectedPreset.id}-${selectedBg.id}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        setProcessing(false);
      },
      "image/jpeg",
      0.95
    );
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          accept="image/*"
          labels={{
            choose: t("chooseFile"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={(list) => {
            const f = list?.[0];
            if (f && f.type.startsWith("image/")) {
              setFile(f);
              setError(null);
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/10 pb-4">
            <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-xs">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              {tCommon("remove")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Controls Left */}
            <div className="space-y-5">
              {/* Size Preset */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Ukuran Pas Foto
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPreset(p)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        selectedPreset.id === p.id
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-xs"
                          : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                      }`}
                    >
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Warna Latar Belakang (Background)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {BG_COLORS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                        selectedBg.id === bg.id
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                          : "border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: bg.hex === "transparent" ? "#eee" : bg.hex }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{bg.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{bg.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom & Alignment Adjustments */}
              <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-4 border border-zinc-200/80 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Perbesar / Zoom:</span>
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={2.5}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[11px] text-zinc-500">Geser Horisontal (X):</span>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      value={offsetX}
                      onChange={(e) => setOffsetX(Number(e.target.value))}
                      className="w-full accent-teal-600 mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500">Geser Vertikal (Y):</span>
                    <input
                      type="range"
                      min={-150}
                      max={150}
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      className="w-full accent-teal-600 mt-1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScale(1.0);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-teal-600 transition pt-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Posisi & Zoom</span>
                </button>
              </div>

              <ErrorBanner message={error} />

              <Button
                type="button"
                loading={processing}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Pas Foto ({selectedPreset.name})</span>
              </Button>
            </div>

            {/* Live Preview Canvas Right */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 min-h-80">
              <div className="text-xs font-semibold text-zinc-500 mb-3">Pratinjau Pas Foto Real-Time</div>
              <div className="relative shadow-2xl rounded-lg overflow-hidden border-2 border-white dark:border-zinc-700">
                <canvas
                  ref={canvasRef}
                  style={{
                    maxHeight: "360px",
                    maxWidth: "260px",
                    objectFit: "contain",
                  }}
                  className="block"
                />
              </div>
              <div className="text-[11px] text-zinc-400 mt-3 text-center">
                Hasil resolusi tinggi 300 DPI siap cetak & unggah
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

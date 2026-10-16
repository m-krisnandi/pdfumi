"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { imagesToPdfClient } from "@/lib/pdfLibUtils";
import {
  Camera,
  RefreshCw,
  Trash2,
  Download,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type ScannedPage = {
  id: string;
  dataUrl: string;
  blob: Blob;
};

export function ScanPdfBoard() {
  const t = useTranslations("scanPdf");
  const tCommon = useTranslations("common");

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [filterMode, setFilterMode] = useState<"normal" | "enhanced" | "bw">("enhanced");
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  async function startCamera(mode = facingMode) {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setError(null);
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada peramban Anda.");
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  function switchCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  }

  function captureSnapshot() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply filter
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    if (filterMode === "bw") {
      // High contrast B&W Scanner effect
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = gray > 128 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filterMode === "enhanced") {
      // Auto-contrast sharpening for documents
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, Math.max(0, (d[i] - 128) * 1.25 + 128));
        d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * 1.25 + 128));
        d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * 1.25 + 128));
      }
      ctx.putImageData(imgData, 0, 0);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const newPage: ScannedPage = {
          id: Math.random().toString(36).slice(2),
          dataUrl: canvas.toDataURL("image/jpeg", 0.9),
          blob,
        };
        setScannedPages((prev) => [...prev, newPage]);
      },
      "image/jpeg",
      0.9
    );
  }

  function removePage(id: string) {
    setScannedPages((prev) => prev.filter((p) => p.id !== id));
  }

  function movePage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= scannedPages.length) return;
    setScannedPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }

  async function handleExportPdf() {
    if (scannedPages.length === 0) {
      setError("Silakan ambil foto dokumen terlebih dahulu");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const files = scannedPages.map(
        (p, idx) =>
          new File([p.blob], `scanned-page-${idx + 1}.jpg`, { type: "image/jpeg" })
      );
      const blob = await imagesToPdfClient(
        files.map((file) => ({ file, orientation: "portrait" })),
        "small"
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scan-dokumen-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan hasil scan ke PDF");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div className="space-y-6">
        {/* Camera Viewport & Controls */}
        <div className="relative rounded-3xl overflow-hidden bg-black flex flex-col items-center justify-center min-h-[380px] shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full max-h-[500px] object-cover"
          />

          {/* Guide Overlay */}
          <div className="absolute inset-8 border-2 border-white/40 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              Posisikan dokumen di dalam bingkai
            </span>
          </div>

          {/* Top Floating Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition shadow cursor-pointer"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Floating Shutter Controls */}
          <div className="absolute bottom-6 flex flex-col items-center gap-3 w-full px-4">
            {/* Filter Toggle */}
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("enhanced")}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  filterMode === "enhanced"
                    ? "bg-teal-500 text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Pertajam
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("bw")}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  filterMode === "bw"
                    ? "bg-teal-500 text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Hitam Putih
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("normal")}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  filterMode === "normal"
                    ? "bg-teal-500 text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Warna Asli
              </button>
            </div>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={captureSnapshot}
              className="w-16 h-16 rounded-full border-4 border-white bg-teal-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Ambil Foto Dokumen"
            >
              <Camera className="w-7 h-7" />
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        {/* Scanned Pages Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Halaman Terpindai ({scannedPages.length})</span>
            </h3>
            {scannedPages.length > 0 && (
              <button
                type="button"
                onClick={() => setScannedPages([])}
                className="text-xs text-red-500 hover:underline cursor-pointer"
              >
                Hapus Semua
              </button>
            )}
          </div>

          {scannedPages.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 text-xs text-zinc-400">
              Belum ada halaman yang difoto. Arahkan kamera dan tekan tombol rana hijau di atas.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {scannedPages.map((page, idx) => (
                <div
                  key={page.id}
                  className="group relative rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 p-1.5 shadow-xs"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 relative">
                    <img
                      src={page.dataUrl}
                      alt={`Halaman ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Hal {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-zinc-400">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => movePage(idx, -1)}
                        className="p-1 hover:text-teal-600 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === scannedPages.length - 1}
                        onClick={() => movePage(idx, 1)}
                        className="p-1 hover:text-teal-600 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      className="p-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scannedPages.length > 0 && (
            <Button
              type="button"
              loading={processing}
              onClick={handleExportPdf}
              className="flex items-center gap-2 mt-4"
            >
              <Download className="w-4 h-4" />
              <span>Simpan & Unduh Jadi Dokumen PDF ({scannedPages.length} Halaman)</span>
            </Button>
          )}
        </div>
      </div>
    </ToolShell>
  );
}

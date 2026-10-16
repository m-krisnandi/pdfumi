"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/components/PdfPreview";
import {
  Video,
  Film,
  Download,
  CheckCircle2,
  Sliders,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
} from "lucide-react";

export function CompressVideoBoard() {
  const t = useTranslations("compressVideo");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    width: number;
    height: number;
    duration: number;
  } | null>(null);

  // Settings
  const [resolutionTarget, setResolutionTarget] = useState<"original" | "720p" | "480p" | "360p">("720p");
  const [bitrateTier, setBitrateTier] = useState<"low" | "medium" | "high">("medium");
  const [includeAudio, setIncludeAudio] = useState(true);

  // Compression state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    if (!file) {
      setVideoSrc(null);
      setVideoInfo(null);
      setCompressedBlob(null);
      setCompressedUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setError(null);

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoInfo({
        width: tempVideo.videoWidth || 1280,
        height: tempVideo.videoHeight || 720,
        duration: tempVideo.duration || 0,
      });
    };
    tempVideo.onerror = () => {
      setError("Format video tidak dapat diputar langsung di browser");
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!compressedBlob) {
      setCompressedUrl(null);
      return;
    }
    const url = URL.createObjectURL(compressedBlob);
    setCompressedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [compressedBlob]);

  async function handleCompress() {
    if (!file || !videoSrc || !videoInfo) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setCompressedBlob(null);
    abortControllerRef.current = false;

    try {
      // 1. Calculate Target Dimensions
      let targetW = videoInfo.width;
      let targetH = videoInfo.height;
      const aspectRatio = videoInfo.width / videoInfo.height;

      if (resolutionTarget === "720p" && videoInfo.height > 720) {
        targetH = 720;
        targetW = Math.round(720 * aspectRatio);
      } else if (resolutionTarget === "480p" && videoInfo.height > 480) {
        targetH = 480;
        targetW = Math.round(480 * aspectRatio);
      } else if (resolutionTarget === "360p" && videoInfo.height > 360) {
        targetH = 360;
        targetW = Math.round(360 * aspectRatio);
      }
      // Ensure even dimensions
      targetW = targetW % 2 === 0 ? targetW : targetW - 1;
      targetH = targetH % 2 === 0 ? targetH : targetH - 1;

      // 2. Calculate Bitrate
      let targetBitrate = 1_200_000; // Medium: 1.2 Mbps
      if (bitrateTier === "low") {
        targetBitrate = 600_000; // Low: 600 kbps (super compact)
      } else if (bitrateTier === "high") {
        targetBitrate = 2_500_000; // High: 2.5 Mbps
      }

      // 3. Setup canvas & stream
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Gagal menginisialisasi canvas grafis");

      const hiddenVideo = document.createElement("video");
      hiddenVideo.src = videoSrc;
      hiddenVideo.muted = !includeAudio;
      hiddenVideo.crossOrigin = "anonymous";
      hiddenVideo.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        hiddenVideo.oncanplay = () => resolve();
        hiddenVideo.onerror = () => reject(new Error("Gagal membaca frame video"));
      });

      const stream = canvas.captureStream(30);

      // Audio handling
      let audioCtx: AudioContext | null = null;
      if (includeAudio) {
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaElementSource(hiddenVideo);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        } catch {
          // If audio context fails (cross-origin / restrictions), continue without blocking video
        }
      }

      // Check supported mime type
      let mimeType = "video/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          mimeType = "video/mp4;codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate,
        audioBitsPerSecond: 96_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const transcodePromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const resultBlob = new Blob(chunks, { type: mimeType });
          resolve(resultBlob);
        };
        recorder.onerror = (e) => reject(e);
      });

      recorder.start(250);
      hiddenVideo.currentTime = 0;
      await hiddenVideo.play();

      const totalDuration = videoInfo.duration || 1;
      let animId = 0;

      const renderLoop = () => {
        if (abortControllerRef.current || hiddenVideo.ended || hiddenVideo.paused) {
          return;
        }
        ctx.drawImage(hiddenVideo, 0, 0, targetW, targetH);
        const curProgress = Math.min(99, Math.round((hiddenVideo.currentTime / totalDuration) * 100));
        setProgress(curProgress);
        animId = requestAnimationFrame(renderLoop);
      };

      animId = requestAnimationFrame(renderLoop);

      hiddenVideo.onended = () => {
        cancelAnimationFrame(animId);
        setProgress(100);
        recorder.stop();
        if (audioCtx) audioCtx.close();
      };

      const finalBlob = await transcodePromise;
      setCompressedBlob(finalBlob);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat kompresi video";
      setError(message);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressedBlob || !file) return;
    const ext = compressedBlob.type.includes("mp4") ? "mp4" : "webm";
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const downloadName = `${baseName}-compressed.${ext}`;
    const a = document.createElement("a");
    a.href = compressedUrl || "";
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const savingsPercent =
    file && compressedBlob
      ? Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))
      : 0;

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
          labels={{
            choose: t("chooseFile"),
            drop: t("dropHint"),
            hint: t("uploadHint"),
          }}
          onFiles={(files) => {
            if (files?.[0]) setFile(files[0]);
          }}
        />
      ) : (
        <div className="space-y-6">
          <ErrorBanner message={error} />

          {/* Video Preview & File Info */}
          <div className="rounded-3xl glass-panel p-5 border border-zinc-200/80 dark:border-white/10">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Native Video Player */}
              <div className="w-full md:w-1/2 aspect-video bg-black/90 rounded-2xl overflow-hidden relative shadow-md">
                {videoSrc && (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* File Meta & Quick Summary */}
              <div className="w-full md:w-1/2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                      <Film className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[200px]">
                        {file.name}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {formatFileSize(file.size)}
                        {videoInfo && ` · ${videoInfo.width}x${videoInfo.height} · ${Math.round(videoInfo.duration)}s`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={processing}
                    className="text-xs text-zinc-400 hover:text-red-500 transition cursor-pointer"
                  >
                    Ganti
                  </button>
                </div>

                {/* Settings Controls */}
                <div className="space-y-3 pt-2 border-t border-zinc-200/60 dark:border-white/5">
                  {/* Resolution Target */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-teal-600" />
                      Resolusi Target
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["original", "720p", "480p", "360p"] as const).map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setResolutionTarget(res)}
                          disabled={processing}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                            resolutionTarget === res
                              ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                              : "border-zinc-200 dark:border-white/10 hover:border-teal-500/50 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {res === "original" ? "Asli" : res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bitrate / Quality Level */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-teal-600" />
                      Tingkat Kompresi
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "low", label: "Tinggi", sub: "Ukuran terkecil" },
                        { id: "medium", label: "Seimbang", sub: "Rekomendasi" },
                        { id: "high", label: "Kualitas Bagus", sub: "Visual tajam" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBitrateTier(item.id as "low" | "medium" | "high")}
                          disabled={processing}
                          className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                            bitrateTier === item.id
                              ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                              : "border-zinc-200 dark:border-white/10 hover:border-teal-500/50 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[10px] opacity-75 font-normal">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Toggle */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      {includeAudio ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                      Sertakan Suara Audio
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeAudio((v) => !v)}
                      disabled={processing}
                      className={`text-xs px-3 py-1 rounded-full border transition cursor-pointer ${
                        includeAudio
                          ? "bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400 font-semibold"
                          : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500"
                      }`}
                    >
                      {includeAudio ? "Aktif" : "Bisu (Mute)"}
                    </button>
                  </div>
                </div>

                {/* Compress Button or Progress Bar */}
                <div className="pt-2">
                  {processing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                          Mengompres frame video...
                        </span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all duration-150 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCompress}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Mulai Kompres Video
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compressed Result Card */}
          {compressedBlob && (
            <div className="rounded-3xl glass-panel p-6 border-2 border-teal-500/60 shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      Kompresi Video Selesai!
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>→</span>
                      <strong className="text-teal-600 dark:text-teal-400 font-bold">
                        {formatFileSize(compressedBlob.size)}
                      </strong>
                      <span className="rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 px-2 py-0.5 text-[10px] font-bold">
                        Hemat {savingsPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh Video
                </Button>
              </div>

              {/* Compressed Video Player Preview */}
              {compressedUrl && (
                <div className="pt-3">
                  <p className="text-xs font-semibold text-zinc-500 mb-2">Pratinjau Hasil Kompresi:</p>
                  <div className="w-full max-w-lg aspect-video bg-black/90 rounded-2xl overflow-hidden shadow-inner">
                    <video src={compressedUrl} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}

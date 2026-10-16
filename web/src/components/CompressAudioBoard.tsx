"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolShell } from "@/components/ToolShell";
import { PdfDropzone } from "@/components/PdfDropzone";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/components/PdfPreview";
import {
  Music,
  Headphones,
  Download,
  CheckCircle2,
  Sparkles,
  Sliders,
  AudioWaveform,
} from "lucide-react";

export function CompressAudioBoard() {
  const t = useTranslations("compressAudio");
  const tCommon = useTranslations("common");

  const [file, setFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Settings
  const [bitrateTier, setBitrateTier] = useState<"64k" | "96k" | "128k" | "192k">("96k");
  const [channelMode, setChannelMode] = useState<"mono" | "stereo">("mono");
  const [sampleRateMode, setSampleRateMode] = useState<"22050" | "44100">("22050");

  // State
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setAudioSrc(null);
      setAudioDuration(0);
      setCompressedBlob(null);
      setCompressedUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setError(null);

    const tempAudio = document.createElement("audio");
    tempAudio.src = url;
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(tempAudio.duration || 0);
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

  // Audio WAV Encoder helper with custom sample rate & channels
  function encodeWav(samples: Float32Array, sampleRate: number, numChannels: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  async function handleCompress() {
    if (!file) return;

    setProcessing(true);
    setProgress(15);
    setError(null);
    setCompressedBlob(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(35);

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(60);

      // Try MediaRecorder for Opus / AAC if supported
      const targetRate = sampleRateMode === "22050" ? 22050 : 44100;
      const isMono = channelMode === "mono";

      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      if (mimeType) {
        // Real-time playback to destination at target bitrate
        let bps = 96_000;
        if (bitrateTier === "64k") bps = 64_000;
        else if (bitrateTier === "128k") bps = 128_000;
        else if (bitrateTier === "192k") bps = 192_000;

        const dest = audioCtx.createMediaStreamDestination();
        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = decodedBuffer;

        if (isMono && decodedBuffer.numberOfChannels > 1) {
          const merger = audioCtx.createChannelMerger(1);
          sourceNode.connect(merger, 0, 0);
          sourceNode.connect(merger, 1, 0);
          merger.connect(dest);
        } else {
          sourceNode.connect(dest);
        }

        const recorder = new MediaRecorder(dest.stream, {
          mimeType,
          audioBitsPerSecond: bps,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const recPromise = new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () => {
            const resultBlob = new Blob(chunks, { type: mimeType });
            resolve(resultBlob);
          };
          recorder.onerror = (e) => reject(e);
        });

        recorder.start(100);
        sourceNode.start(0);

        const dur = decodedBuffer.duration;
        const startTime = Date.now();
        const timer = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const pct = Math.min(95, 60 + Math.round((elapsed / dur) * 35));
          setProgress(pct);
        }, 150);

        sourceNode.onended = () => {
          clearInterval(timer);
          setProgress(99);
          recorder.stop();
        };

        const resultBlob = await recPromise;
        await audioCtx.close();
        setCompressedBlob(resultBlob);
      } else {
        // Fallback: high-efficiency resampled PCM WAV
        const numChannels = isMono ? 1 : Math.min(2, decodedBuffer.numberOfChannels);
        const originalRate = decodedBuffer.sampleRate;
        const ratio = originalRate / targetRate;
        const newLength = Math.round(decodedBuffer.length / ratio);

        let interleaved: Float32Array;

        if (numChannels === 1) {
          interleaved = new Float32Array(newLength);
          const ch0 = decodedBuffer.getChannelData(0);
          const ch1 = decodedBuffer.numberOfChannels > 1 ? decodedBuffer.getChannelData(1) : ch0;
          for (let i = 0; i < newLength; i++) {
            const origIdx = Math.min(Math.floor(i * ratio), decodedBuffer.length - 1);
            interleaved[i] = (ch0[origIdx] + ch1[origIdx]) * 0.5;
          }
        } else {
          interleaved = new Float32Array(newLength * 2);
          const ch0 = decodedBuffer.getChannelData(0);
          const ch1 = decodedBuffer.getChannelData(1);
          for (let i = 0; i < newLength; i++) {
            const origIdx = Math.min(Math.floor(i * ratio), decodedBuffer.length - 1);
            interleaved[i * 2] = ch0[origIdx];
            interleaved[i * 2 + 1] = ch1[origIdx];
          }
        }

        setProgress(90);
        const wavBlob = encodeWav(interleaved, targetRate, numChannels);
        await audioCtx.close();
        setCompressedBlob(wavBlob);
      }
      setProgress(100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses audio";
      setError(message);
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressedBlob || !file) return;
    const ext = compressedBlob.type.includes("mp4")
      ? "m4a"
      : compressedBlob.type.includes("wav")
      ? "wav"
      : "webm";
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
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma"
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

          {/* Audio Info & Controls */}
          <div className="rounded-3xl glass-panel p-6 border border-zinc-200/80 dark:border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  <Headphones className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatFileSize(file.size)}
                    {audioDuration > 0 && ` · Durasi ${Math.round(audioDuration)}s`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={processing}
                className="text-xs text-zinc-400 hover:text-red-500 transition self-start sm:self-auto cursor-pointer"
              >
                Ganti Berkas
              </button>
            </div>

            {/* Native Player Preview */}
            {audioSrc && (
              <div className="rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-3 flex items-center gap-3">
                <audio src={audioSrc} controls className="w-full h-10" />
              </div>
            )}

            {/* Compression Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Target Bitrate */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <AudioWaveform className="w-3.5 h-3.5 text-teal-600" />
                  Target Bitrate
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "64k", label: "64 kbps", sub: "Voice Note" },
                    { id: "96k", label: "96 kbps", sub: "Standar" },
                    { id: "128k", label: "128 kbps", sub: "Musik" },
                    { id: "192k", label: "192 kbps", sub: "Hi-Fi" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBitrateTier(item.id as "64k" | "96k" | "128k" | "192k")}
                      disabled={processing}
                      className={`p-2 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                        bitrateTier === item.id
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "border-zinc-200 dark:border-white/10 hover:border-teal-500/50 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] opacity-75 font-normal">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels (Mono vs Stereo) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Kanal Audio
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "mono", label: "Mono", sub: "Hemat 50% ukuran" },
                    { id: "stereo", label: "Stereo", sub: "2 Saluran asli" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChannelMode(item.id as "mono" | "stereo")}
                      disabled={processing}
                      className={`p-2 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                        channelMode === item.id
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "border-zinc-200 dark:border-white/10 hover:border-teal-500/50 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] opacity-75 font-normal">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-600" />
                  Sample Rate
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "22050", label: "22.05 kHz", sub: "Speech ringkas" },
                    { id: "44100", label: "44.1 kHz", sub: "Studio asli" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSampleRateMode(item.id as "22050" | "44100")}
                      disabled={processing}
                      className={`p-2 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                        sampleRateMode === item.id
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "border-zinc-200 dark:border-white/10 hover:border-teal-500/50 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] opacity-75 font-normal">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {processing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                      Mengompres audio peramban...
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
                  Mulai Kompres Audio
                </Button>
              )}
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
                      Kompresi Audio Selesai!
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
                  Unduh Audio
                </Button>
              </div>

              {/* Compressed Audio Player Preview */}
              {compressedUrl && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-zinc-500 mb-2">Pratinjau Hasil Kompresi:</p>
                  <div className="rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-3 flex items-center">
                    <audio src={compressedUrl} controls className="w-full h-10" />
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

"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { apiFetch, toApiError, friendlyError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
  Mail,
  Sparkles,
  Camera,
  X,
  Image as ImageIcon,
} from "lucide-react";

type CategoryType = "BUG" | "FEATURE" | "FEEDBACK";

interface ScreenshotItem {
  id: string;
  name: string;
  dataUrl: string;
}

/** Resize and compress image to high-efficiency JPEG data URL (~50-150KB) */
async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function FeedbackBoard() {
  const t = useTranslations("feedback");
  const locale = useLocale();

  const [category, setCategory] = useState<CategoryType>("BUG");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleScreenshotFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const availableSlots = 5 - screenshots.length;
    if (availableSlots <= 0) {
      setError(t("valMaxScreenshots"));
      return;
    }

    const toProcess = Array.from(files).slice(0, availableSlots);
    setProcessingImages(true);

    try {
      const newItems: ScreenshotItem[] = [];
      for (const f of toProcess) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 10 * 1024 * 1024) {
          setError(t("valImageSize"));
          continue;
        }
        const dataUrl = await compressImageToDataUrl(f);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: f.name,
          dataUrl,
        });
      }
      setScreenshots((prev) => [...prev, ...newItems]);
    } catch {
      setError(t("valGenericError"));
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeScreenshot(id: string) {
    setScreenshots((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError(t("valRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          email: email.trim() || null,
          screenshots: screenshots.map((s) => s.dataUrl),
        }),
      });

      if (!res.ok) {
        throw await toApiError(res);
      }

      setIsSuccess(true);
      setSubject("");
      setDescription("");
      setEmail("");
      setScreenshots([]);
    } catch (err) {
      setError(friendlyError(err, t("valGenericError"), locale));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-zinc-200/60 dark:border-white/10">
        {/* Header */}
        <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-teal-600 dark:text-teal-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t("description")}
          </p>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {t("successTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                {t("successDesc")}
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="glass-pill px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {t("submitAnother")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorBanner message={error} />}

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                {t("categoryLabel")}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCategory("BUG")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    category === "BUG"
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Bug className="w-4 h-4 text-rose-500" />
                  <span>{t("catBug")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("FEATURE")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    category === "FEATURE"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  <span>{t("catFeature")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("FEEDBACK")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    category === "FEEDBACK"
                      ? "bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-400 shadow-sm"
                      : "border-zinc-200/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-500" />
                  <span>{t("catFeedback")}</span>
                </button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("subjectLabel")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    category === "BUG"
                      ? t("placeholderBugSubject")
                      : category === "FEATURE"
                      ? t("placeholderFeatureSubject")
                      : t("placeholderFeedbackSubject")
                  }
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("descriptionLabel")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={
                  category === "BUG"
                    ? t("placeholderBugDesc")
                    : t("placeholderGeneralDesc")
                }
                className="glass-input w-full p-4 rounded-xl text-sm resize-y leading-relaxed"
                required
              />
            </div>

            {/* Attach Multiple Screenshots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("screenshotsLabel")}
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {screenshots.length} / 5
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t("screenshotsHint")}
              </p>

              {/* Screenshots Preview Grid */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {screenshots.map((s, idx) => (
                  <div
                    key={s.id}
                    className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.dataUrl}
                      alt={`Screenshot #${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(s.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Hapus gambar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {/* Add Screenshot Button */}
                {screenshots.length < 5 && (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/15 hover:border-teal-500 hover:bg-teal-500/5 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-semibold text-center px-1 leading-tight">
                      {processingImages ? "..." : t("addScreenshots")}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="sr-only"
                      disabled={processingImages}
                      onChange={(e) => void handleScreenshotFiles(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("emailLabel")}
                </label>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{t("emailHint")}</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t("emailPrivacy")}
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || processingImages}
                className="w-full py-3 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-500 text-white dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>{t("submittingBtn")}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t("submitBtn")}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

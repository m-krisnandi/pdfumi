"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfFilePicker } from "@/components/PdfFilePicker";
import {
  WatermarkInteractivePreview,
  type WatermarkPose,
} from "@/components/WatermarkInteractivePreview";

const DEFAULT_POSE: WatermarkPose = { x: 0.5, y: 0.5, rotation: 35 };

export function WatermarkPdfBoard() {
  const t = useTranslations("watermark");
  const tCommon = useTranslations("common");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("Pdfumi");
  const [pose, setPose] = useState<WatermarkPose>(DEFAULT_POSE);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0] ?? null;
  const ready = Boolean(file);

  function onFilesChange(next: File[]) {
    setFiles(next);
    setError(null);
    setPose(DEFAULT_POSE);
  }

  function setPreset(next: Partial<WatermarkPose>) {
    setPose((prev) => ({ ...prev, ...next }));
  }

  async function onDownload() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    setDownloading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("text", text.trim() || "Pdfumi");
    form.append("x", String(pose.x));
    form.append("y", String(pose.y));
    form.append("rotation", String(pose.rotation));
    try {
      const res = await fetch(`${API_BASE}/api/v1/watermark`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, keepOriginalName(file, "document.pdf", "pdf"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setDownloading(false);
    }
  }

  const presetBtn =
    "rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-xs transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent)]";

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div
        className={
          ready
            ? "grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-stretch"
            : "space-y-4"
        }
      >
        <div
          className={
            ready ? "flex min-h-0 flex-col gap-4 lg:h-[min(70vh,36rem)]" : "flex min-h-0 flex-col gap-4"
          }
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-1 pt-1">
            <PdfFilePicker
              files={files}
              onChange={onFilesChange}
              labels={{
                choose: t("chooseFile"),
                drop: t("dropHint"),
                hint: t("uploadHint"),
                remove: tCommon("remove"),
                selected: t("selected"),
              }}
            />

            {ready ? (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block text-[color:var(--ink)]/80">{t("textLabel")}</span>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={40}
                    className="w-full rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]"
                  />
                </label>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-[color:var(--ink)]/80">{t("positionLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.5, y: 0.5, rotation: 35 })}>
                      {t("presetDiagonal")}
                    </button>
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.5, y: 0.5, rotation: 0 })}>
                      {t("presetCenter")}
                    </button>
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.5, y: 0.18, rotation: 0 })}>
                      {t("presetTop")}
                    </button>
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.5, y: 0.82, rotation: 0 })}>
                      {t("presetBottom")}
                    </button>
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.2, y: 0.5, rotation: -90 })}>
                      {t("presetLeft")}
                    </button>
                    <button type="button" className={presetBtn} onClick={() => setPreset({ x: 0.8, y: 0.5, rotation: 90 })}>
                      {t("presetRight")}
                    </button>
                    <button
                      type="button"
                      className={presetBtn}
                      onClick={() => setPreset({ rotation: pose.rotation === 35 ? -35 : 35 })}
                    >
                      {t("presetFlip")}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {ready ? (
            <div className="mt-auto shrink-0 space-y-3 border-t border-[color:var(--line)] pt-4">
              <ErrorBanner message={error} />
              <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
                {downloading ? tCommon("processing") : tCommon("downloadResult")}
              </Button>
            </div>
          ) : (
            <ErrorBanner message={error} />
          )}
        </div>

        {ready && file ? (
          <section className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-[min(70vh,36rem)]">
            <div>
              <h2 className="text-sm font-medium text-[color:var(--ink)]/80">{t("livePreview")}</h2>
              <p className="mt-1 text-xs text-[color:var(--ink)]/55">{t("liveHint")}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <WatermarkInteractivePreview
                file={file}
                text={text}
                pose={pose}
                onPoseChange={setPose}
                dragHint={t("dragHint")}
              />
            </div>
          </section>
        ) : null}
      </div>
    </ToolShell>
  );
}
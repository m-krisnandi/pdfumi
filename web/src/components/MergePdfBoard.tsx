"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { mergePdfFiles } from "@/lib/mergePdf";
import { rotatePdfFile } from "@/lib/fileRotate";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { MergeDocumentBoard, type MergeDoc } from "@/components/MergeDocumentBoard";
import { PdfPreview } from "@/components/PdfPreview";

export function MergePdfBoard() {
  const t = useTranslations("merge");
  const tCommon = useTranslations("common");
  const [docs, setDocs] = useState<MergeDoc[]>([]);
  const [merged, setMerged] = useState<Blob | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const files = docs.map((d) => d.file);
  const rotations = docs.map((d) => d.rotation ?? 0);
  const showPreview = docs.length >= 2;

  function onDocsChange(next: MergeDoc[]) {
    setDocs(next);
    setError(null);
    if (next.length < 2) setMerged(null);
  }

  useEffect(() => {
    if (files.length < 2) {
      setMerged(null);
      setPreviewing(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const blob = await mergePdfFiles(files, rotations);
        if (!cancelled) {
          setMerged(blob);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setMerged(null);
          setError(t("previewFailed"));
        }
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [docs, t]); // eslint-disable-line react-hooks/exhaustive-deps -- files/rotations derived from docs

  async function onDownload() {
    if (files.length < 2) {
      setError(t("needTwo"));
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const prepared = await Promise.all(
        docs.map((d) => rotatePdfFile(d.file, d.rotation ?? 0)),
      );
      const form = new FormData();
      prepared.forEach((file) => form.append("files", file));
      const res = await fetch(`${API_BASE}/api/v1/merge`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, keepOriginalName(files[0], "merged.pdf", "pdf"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <div
        className={
          showPreview
            ? "grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-stretch"
            : "space-y-4"
        }
      >
        <div
          className={
            showPreview
              ? "flex min-h-0 flex-col gap-4 lg:h-[min(70vh,36rem)]"
              : "flex min-h-0 flex-col gap-4"
          }
        >
          <div className={showPreview ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-1 pt-1" : "w-full"}>
            <MergeDocumentBoard
              docs={docs}
              maxFiles={10}
              onChange={onDocsChange}
              layout={showPreview ? "column" : "row"}
              labels={{
                choose: t("chooseFiles"),
                drop: t("dropHint"),
                hint: t("uploadHint"),
                addMore: t("addMore"),
                remove: tCommon("remove"),
                reorderHint: t("reorderHint"),
                preview: tCommon("preview"),
                closePreview: tCommon("close"),
                rotate: tCommon("rotate"),
                formatPages: (count) =>
                  count === 1 ? t("pageOne") : t("pageMany", { count }),
              }}
            />
          </div>

          {showPreview ? (
            <div className="mt-auto shrink-0 space-y-3 border-t border-zinc-200/60 dark:border-white/10 pt-4">
              <ErrorBanner message={error} />
              <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
                {downloading ? tCommon("processing") : tCommon("downloadResult")}
              </Button>
            </div>
          ) : (
            <ErrorBanner message={error} />
          )}
        </div>

        {showPreview ? (
          <section className="flex min-h-0 min-w-0 flex-col gap-3 lg:h-[min(70vh,36rem)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{t("mergedPreview")}</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("mergedHint")}</p>
              </div>
              {previewing ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{tCommon("processing")}</span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {merged ? (
                <PdfPreview file={merged} title={t("mergedPreview")} className="h-full min-h-[20rem]" />
              ) : (
                <div className="flex h-full min-h-[20rem] items-center justify-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] text-sm text-zinc-500 dark:text-zinc-400">
                  {tCommon("processing")}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </ToolShell>
  );
}

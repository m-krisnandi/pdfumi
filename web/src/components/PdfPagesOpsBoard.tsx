"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, friendlyError } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { buildPdfFromPages } from "@/lib/fileRotate";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PageWorkspace, type PageItem } from "@/components/PageWorkspace";

type OpsMode = "split" | "rotate" | "delete" | "extract" | "organize";

const ENDPOINT: Record<OpsMode, string> = {
  split: "/api/v1/pdf/split",
  rotate: "/api/v1/pdf/rotate",
  delete: "/api/v1/pdf/delete-pages",
  extract: "/api/v1/pdf/extract-pages",
  organize: "/api/v1/pdf/organize",
};

const NS: Record<OpsMode, string> = {
  split: "splitPdf",
  rotate: "rotatePdf",
  delete: "deletePages",
  extract: "extractPages",
  organize: "organizePdf",
};

function hasAnyRotation(items: PageItem[]) {
  return items.some((p) => (p.rotation ?? 0) !== 0);
}

export function PdfPagesOpsBoard({ mode }: { mode: OpsMode }) {
  const t = useTranslations(NS[mode]);
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPagePick = mode === "split" || mode === "extract";
  const pageMode =
    mode === "organize" || mode === "rotate" || mode === "delete"
      ? "reorder"
      : needsPagePick
        ? "select"
        : "view";

  function onPagesChange(next: PageItem[]) {
    setPages(next);
    if (next.length > sourcePageCount) setSourcePageCount(next.length);
  }

  async function onDownload() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    if (pages.length === 0) {
      setError(t("needFile"));
      return;
    }

    const picked =
      mode === "split" || mode === "extract"
        ? pages.filter((p) => selected.has(p.id))
        : pages;

    if (needsPagePick && picked.length === 0) {
      setError(t("needPages"));
      return;
    }

    if (mode === "delete") {
      const kept = new Set(pages.map((p) => p.pageNumber));
      const toDelete: number[] = [];
      for (let i = 1; i <= sourcePageCount; i++) {
        if (!kept.has(i)) toDelete.push(i);
      }
      if (toDelete.length === 0) {
        setError(t("needPages"));
        return;
      }
      if (pages.length === 0) {
        setError(t("needPages"));
        return;
      }
    }

    setDownloading(true);
    setError(null);

    try {
      let bakedFile: File | null = null;
      let defaultName = "document.pdf";

      if (mode === "rotate") {
        bakedFile = await buildPdfFromPages(
          file,
          pages.map((p) => p.pageNumber),
          pages.map((p) => p.rotation ?? 0),
        );
        defaultName = "rotated.pdf";
      } else if (mode === "organize") {
        bakedFile = await buildPdfFromPages(
          file,
          pages.map((p) => p.pageNumber),
          pages.map((p) => p.rotation ?? 0),
        );
        defaultName = "organized.pdf";
      } else if (mode === "delete") {
        bakedFile = await buildPdfFromPages(
          file,
          pages.map((p) => p.pageNumber),
          pages.map((p) => p.rotation ?? 0),
        );
        defaultName = "document.pdf";
      } else if (mode === "split" || mode === "extract") {
        bakedFile = await buildPdfFromPages(
          file,
          picked.map((p) => p.pageNumber),
          picked.map((p) => p.rotation ?? 0),
        );
        defaultName = mode === "split" ? "split.pdf" : "extracted.pdf";
      }

      if (bakedFile) {
        const url = URL.createObjectURL(bakedFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = keepOriginalName(file, defaultName, "pdf");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        try {
          const form = new FormData();
          form.append("file", bakedFile);
          form.append(
            "pages",
            (mode === "split" || mode === "extract" ? picked : pages)
              .map((_, i) => i + 1)
              .join(","),
          );
          fetch(`${API_BASE}${ENDPOINT[mode]}`, {
            method: "POST",
            headers: authHeaders(),
            body: form,
          }).catch(() => {});
        } catch {
          /* ignore */
        }
        return;
      }
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric"), locale));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <PageWorkspace
        file={file}
        maxPages={500}
        onFile={(f) => {
          setFile(f);
          setSourcePageCount(0);
          setError(null);
        }}
        pages={pages}
        onPagesChange={onPagesChange}
        selected={selected}
        onSelectedChange={setSelected}
        mode={pageMode}
        allowReorder={mode === "split" || mode === "extract"}
        defaultSelectAll={mode === "split"}
        labels={{
          choose: t("chooseFile"),
          drop: t("dropHint"),
          hint: t("uploadHint"),
          remove: tCommon("remove"),
          reorderHint:
            mode === "organize" || mode === "rotate" || mode === "delete"
              ? t("reorderHint")
              : undefined,
          selectHint: needsPagePick ? t("selectHint") : undefined,
          selectAll: needsPagePick ? t("selectAll") : undefined,
          clearSelection: needsPagePick ? t("clearSelection") : undefined,
          preview: tCommon("preview"),
          closePreview: tCommon("close"),
          rotate: tCommon("rotate"),
          loadingPages: t("loadingPages"),
          replace: t("replace"),
          formatPages: (count) => (count === 1 ? t("pageOne") : t("pageMany", { count })),
        }}
      />

      {file ? (
        <div className="mt-6 space-y-3 border-t border-[color:var(--line)] pt-4">
          {mode === "split" ? (
            <p className="text-sm text-[color:var(--ink)]/65">
              {t("resultHint", { count: selected.size || 0 })}
            </p>
          ) : null}
          {mode === "rotate" || mode === "delete" ? (
            <p className="text-sm text-[color:var(--ink)]/65">{t("cardHint")}</p>
          ) : null}
          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
            {downloading
              ? tCommon("processing")
              : mode === "split"
                ? tCommon("downloadPdf")
                : tCommon("downloadResult")}
          </Button>
        </div>
      ) : (
        <ErrorBanner message={error} />
      )}
    </ToolShell>
  );
}

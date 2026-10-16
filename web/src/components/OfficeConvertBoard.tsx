"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, friendlyError } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { formatFileSize } from "@/components/PdfPreview";

type Mode = "pdf-to-word" | "word-to-pdf" | "pdf-to-excel" | "excel-to-pdf";

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isWord(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".docx") ||
    n.endsWith(".doc") ||
    file.type.includes("word") ||
    file.type.includes("msword") ||
    file.type.includes("officedocument.wordprocessingml")
  );
}

function isExcel(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".xlsx") ||
    n.endsWith(".xls") ||
    file.type.includes("sheet") ||
    file.type.includes("excel") ||
    file.type.includes("ms-excel")
  );
}

const NS: Record<Mode, string> = {
  "pdf-to-word": "pdfToWord",
  "word-to-pdf": "wordToPdf",
  "pdf-to-excel": "pdfToExcel",
  "excel-to-pdf": "excelToPdf",
};

const ENDPOINT: Record<Mode, string> = {
  "pdf-to-word": "/api/v1/convert/pdf-to-word",
  "word-to-pdf": "/api/v1/convert/word-to-pdf",
  "pdf-to-excel": "/api/v1/convert/pdf-to-excel",
  "excel-to-pdf": "/api/v1/convert/excel-to-pdf",
};

export function OfficeConvertBoard({ mode }: { mode: Mode }) {
  const t = useTranslations(NS[mode]);
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept =
    mode === "pdf-to-word" || mode === "pdf-to-excel"
      ? "application/pdf"
      : mode === "word-to-pdf"
        ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    const ok =
      mode === "pdf-to-word" || mode === "pdf-to-excel"
        ? isPdf(f)
        : mode === "word-to-pdf"
          ? isWord(f)
          : isExcel(f);
    if (!ok) return;
    setFile(f);
    setError(null);
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
    const fallback =
      mode === "pdf-to-word"
        ? keepOriginalName(file, "document.docx", "docx")
        : mode === "pdf-to-excel"
          ? keepOriginalName(file, "document.xlsx", "xlsx")
          : keepOriginalName(file, "document.pdf", "pdf");
    try {
      const res = await fetch(`${API_BASE}${ENDPOINT[mode]}`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, fallback);
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric")));
    } finally {
      setDownloading(false);
    }
  }

  const badge =
    mode === "word-to-pdf" ? "W" : mode === "excel-to-pdf" || mode === "pdf-to-excel" ? "X" : null;

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          accept={accept}
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={takeFiles}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            {isPdf(file) ? (
              <PdfDocumentThumb file={file} className="aspect-[3/4] w-36" />
            ) : (
              <div className="flex aspect-[3/4] w-36 flex-col items-center justify-center gap-2 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 p-3 text-center">
                <span className="text-2xl font-semibold text-[color:var(--accent)]">{badge}</span>
                <span className="truncate text-[10px] text-[color:var(--ink)]/50">{file.name}</span>
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-sm font-medium text-[color:var(--accent)]">{file.name}</p>
              <p className="text-xs text-[color:var(--ink)]/55">{formatFileSize(file.size)}</p>
              <p className="text-sm text-[color:var(--ink)]/65">{t("resultHint")}</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-[color:var(--ink)]/50 underline hover:text-red-700"
              >
                {tCommon("remove")}
              </button>
            </div>
          </div>
          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
            {downloading ? tCommon("processing") : t("downloadResult")}
          </Button>
        </div>
      )}
      {!file ? <ErrorBanner message={error} /> : null}
    </ToolShell>
  );
}

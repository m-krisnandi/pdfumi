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

export function PdfToImageBoard({ format }: { format: "jpg" | "png" }) {
  const t = useTranslations(format === "jpg" ? "pdfToJpg" : "pdfToPng");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
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
    form.append("format", format);
    try {
      const res = await fetch(`${API_BASE}/api/v1/convert/pdf-to-images`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, keepOriginalName(file, "pages.zip", "zip"));
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric")));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={takeFiles}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <PdfDocumentThumb file={file} className="h-48 w-36" />
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
            {downloading ? tCommon("processing") : t("downloadZip")}
          </Button>
        </div>
      )}
      {!file ? <ErrorBanner message={error} /> : null}
    </ToolShell>
  );
}

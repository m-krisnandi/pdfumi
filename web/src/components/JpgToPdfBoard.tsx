"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { rotateImageFile } from "@/lib/fileRotate";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FileDocumentBoard, type UploadDoc } from "@/components/FileDocumentBoard";
import { formatFileSize } from "@/components/PdfPreview";

export function JpgToPdfBoard() {
  const t = useTranslations("jpgToPdf");
  const tCommon = useTranslations("common");
  const [docs, setDocs] = useState<UploadDoc[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDownload() {
    if (!docs.length) {
      setError(t("needFiles"));
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const prepared = await Promise.all(
        docs.map((d) => rotateImageFile(d.file, d.rotation ?? 0)),
      );
      const form = new FormData();
      prepared.forEach((file) => form.append("files", file));
      const res = await fetch(`${API_BASE}/api/v1/convert/images-to-pdf`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, keepOriginalName(docs[0]?.file, "images.pdf", "pdf"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <FileDocumentBoard
        docs={docs}
        kind="image"
        maxFiles={20}
        onChange={(next) => {
          setDocs(next);
          setError(null);
        }}
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
          formatMeta: (file) => formatFileSize(file.size),
        }}
      />
      {docs.length > 0 ? (
        <div className="mt-6 space-y-3 border-t border-[color:var(--line)] pt-4">
          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
            {downloading ? tCommon("processing") : tCommon("downloadPdf")}
          </Button>
        </div>
      ) : (
        <ErrorBanner message={error} />
      )}
    </ToolShell>
  );
}

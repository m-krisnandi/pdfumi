"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, friendlyError } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { formatFileSize } from "@/components/PdfPreview";
import { CreateSignatureModal } from "@/components/CreateSignatureModal";
import { RequestSignatureModal } from "@/components/RequestSignatureModal";
import {
  SignPdfWorkspace,
  type PlacedSignature,
} from "@/components/SignPdfWorkspace";
import { Share2 } from "lucide-react";

async function dataUrlToFile(dataUrl: string, name: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/png" });
}

export function SignPdfBoard() {
  const t = useTranslations("signPdf");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [stampSrc, setStampSrc] = useState<string | null>(null);
  const [placement, setPlacement] = useState<PlacedSignature | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPageCount = useCallback((n: number) => {
    setPageCount(n);
    setPage((p) => Math.min(p, n));
  }, []);

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setPage(1);
    setPageCount(1);
    setPlacement(null);
    setStampSrc(null);
    setError(null);
  }

  function resetDoc() {
    setFile(null);
    setPlacement(null);
    setStampSrc(null);
    setPage(1);
    setError(null);
  }

  function onSignatureCreated(dataUrl: string) {
    setModalOpen(false);
    setPlacement(null);
    setStampSrc(dataUrl);
    setError(null);
  }

  async function onDownload() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    if (!placement) {
      setError(stampSrc ? t("needPlace") : t("needSignature"));
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const sig = await dataUrlToFile(placement.dataUrl, "signature.png");
      const form = new FormData();
      form.append("file", file);
      form.append("signature", sig);
      form.append("x", String(placement.x));
      form.append("y", String(placement.y));
      form.append("width", String(placement.width));
      form.append("page", String(placement.page));
      const res = await fetch(`${API_BASE}/api/v1/pdf/sign`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      await downloadBlob(res, keepOriginalName(file, "document.pdf", "pdf"));
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric")));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      {!file ? (
        <div className="space-y-4">
          <PdfDropzone
            labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
            onFiles={takeFiles}
          />
          <ErrorBanner message={error} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[color:var(--accent)]">{file.name}</p>
              <p className="text-xs text-[color:var(--ink)]/55">{formatFileSize(file.size)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3.5 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Minta Tanda Tangan Orang Lain</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm !text-white shadow-sm transition hover:opacity-95 cursor-pointer"
              >
                {placement || stampSrc ? t("changeSignature") : t("createSignature")}
              </button>
              {(placement || stampSrc) && (
                <button
                  type="button"
                  onClick={() => {
                    setPlacement(null);
                    setStampSrc(null);
                  }}
                  className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs hover:border-red-400 hover:text-red-700 cursor-pointer"
                >
                  {t("clearSignature")}
                </button>
              )}
              <button
                type="button"
                onClick={resetDoc}
                className="text-xs text-[color:var(--ink)]/50 underline hover:text-red-700 cursor-pointer"
              >
                {tCommon("remove")}
              </button>
            </div>
          </div>

          {stampSrc && !placement ? (
            <div className="rounded-xl border border-[color:var(--accent)]/25 bg-[color:var(--accent-soft)]/60 px-4 py-3 text-sm text-[color:var(--accent)]">
              {t("placeBanner")}
            </div>
          ) : null}

          <SignPdfWorkspace
            file={file}
            page={page}
            pageCount={pageCount}
            onPageCount={onPageCount}
            onPageChange={setPage}
            placement={placement}
            onPlacementChange={setPlacement}
            stampSrc={stampSrc}
            onStampConsumed={() => setStampSrc(null)}
            labels={{
              placeHint: t("placeHint"),
              dragHint: t("dragHint"),
              deleteSig: t("deleteSig"),
            }}
          />

          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
            {downloading ? tCommon("processing") : t("downloadSigned")}
          </Button>
        </div>
      )}

      <CreateSignatureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={onSignatureCreated}
        labels={{
          title: t("modalTitle"),
          draw: t("methodDraw"),
          type: t("methodType"),
          upload: t("methodUpload"),
          drawHere: t("drawHint"),
          typePlaceholder: t("typePlaceholder"),
          uploadHint: t("uploadHintSig"),
          clear: t("clearDraw"),
          cancel: t("cancel"),
          create: t("create"),
        }}
      />

      {file && (
        <RequestSignatureModal
          open={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          documentName={file.name}
        />
      )}
    </ToolShell>
  );
}

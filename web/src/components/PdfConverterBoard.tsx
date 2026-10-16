"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, friendlyError } from "@/lib/api";
import { keepOriginalName } from "@/lib/downloadName";
import { Button } from "@/components/ui/Button";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { PdfDocumentThumb } from "@/components/PdfDocumentThumb";
import { ImageFileThumb } from "@/components/ImageFileThumb";
import { formatFileSize } from "@/components/PdfPreview";
import { Link } from "@/i18n/navigation";

type InputKind = "pdf" | "word" | "excel" | "image";
type TargetFormat = "pdf" | "docx" | "xlsx" | "jpg" | "png";

type QueuedFile = {
  id: string;
  file: File;
  kind: InputKind;
};

const ACCEPT =
  "application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp";

function detectKind(file: File): InputKind | null {
  const n = file.name.toLowerCase();
  if (file.type === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (
    n.endsWith(".docx") ||
    n.endsWith(".doc") ||
    file.type.includes("word") ||
    file.type.includes("msword") ||
    file.type.includes("officedocument.wordprocessingml")
  ) {
    return "word";
  }
  if (
    n.endsWith(".xlsx") ||
    n.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("ms-excel") ||
    file.type.includes("excel")
  ) {
    return "excel";
  }
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(n)) return "image";
  return null;
}

function targetsFor(kind: InputKind): TargetFormat[] {
  if (kind === "pdf") return ["docx", "xlsx", "jpg", "png"];
  if (kind === "word" || kind === "excel") return ["pdf"];
  return ["pdf"];
}

function defaultTarget(kind: InputKind): TargetFormat {
  return targetsFor(kind)[0];
}

export function PdfConverterBoard() {
  const t = useTranslations("pdfConverter");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<QueuedFile[]>([]);
  const [target, setTarget] = useState<TargetFormat>("docx");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputKind = items[0]?.kind ?? null;
  const available = useMemo(
    () =>
      inputKind
        ? targetsFor(inputKind)
        : (["pdf", "docx", "xlsx", "jpg", "png"] as TargetFormat[]),
    [inputKind],
  );

  function takeFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: QueuedFile[] = [];
    for (const file of Array.from(list)) {
      const kind = detectKind(file);
      if (!kind) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        kind,
      });
    }
    if (!next.length) {
      setError(t("unsupported"));
      return;
    }
    const firstKind = next[0].kind;
    const accepted =
      firstKind === "image"
        ? next.filter((i) => i.kind === "image").slice(0, 20)
        : [next[0]];
    setItems(accepted);
    setTarget(defaultTarget(accepted[0].kind));
    setError(null);
  }

  function clear() {
    setItems([]);
    setError(null);
  }

  async function onConvert() {
    if (!items.length || !inputKind) {
      setError(t("needFile"));
      return;
    }
    if (!available.includes(target)) {
      setError(t("needTarget"));
      return;
    }

    setDownloading(true);
    setError(null);
    try {
      if (inputKind === "pdf" && target === "docx") {
        const form = new FormData();
        form.append("file", items[0].file);
        const res = await fetch(`${API_BASE}/api/v1/convert/pdf-to-word`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "document.docx", "docx"));
      } else if (inputKind === "pdf" && target === "xlsx") {
        const form = new FormData();
        form.append("file", items[0].file);
        const res = await fetch(`${API_BASE}/api/v1/convert/pdf-to-excel`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "document.xlsx", "xlsx"));
      } else if (inputKind === "pdf" && (target === "jpg" || target === "png")) {
        const form = new FormData();
        form.append("file", items[0].file);
        form.append("format", target);
        const res = await fetch(`${API_BASE}/api/v1/convert/pdf-to-images`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "pages.zip", "zip"));
      } else if (inputKind === "word" && target === "pdf") {
        const form = new FormData();
        form.append("file", items[0].file);
        const res = await fetch(`${API_BASE}/api/v1/convert/word-to-pdf`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "document.pdf", "pdf"));
      } else if (inputKind === "excel" && target === "pdf") {
        const form = new FormData();
        form.append("file", items[0].file);
        const res = await fetch(`${API_BASE}/api/v1/convert/excel-to-pdf`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "document.pdf", "pdf"));
      } else if (inputKind === "image" && target === "pdf") {
        const form = new FormData();
        items.forEach((i) => form.append("files", i.file));
        const res = await fetch(`${API_BASE}/api/v1/convert/images-to-pdf`, {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        await downloadBlob(res, keepOriginalName(items[0].file, "images.pdf", "pdf"));
      } else {
        setError(t("needTarget"));
        return;
      }
    } catch (err) {
      setError(friendlyError(err, tCommon("errorGeneric")));
    } finally {
      setDownloading(false);
    }
  }

  const targetLabel = (fmt: TargetFormat) => {
    if (fmt === "pdf") return t("toPdf");
    if (fmt === "docx") return t("toWord");
    if (fmt === "xlsx") return t("toExcel");
    if (fmt === "jpg") return t("toJpg");
    return t("toPng");
  };

  function officeThumb(kind: "word" | "excel") {
    return (
      <div className="flex aspect-[3/4] w-28 flex-col items-center justify-center gap-1 rounded-xl border border-[color:var(--line)] glass-card border border-zinc-200/80 dark:border-white/10">
        <span className="text-xl font-semibold text-[color:var(--accent)]">
          {kind === "word" ? "W" : "X"}
        </span>
      </div>
    );
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      {items.length === 0 ? (
        <div className="space-y-6">
          <PdfDropzone
            multiple
            accept={ACCEPT}
            labels={{ choose: t("chooseFiles"), drop: t("dropHint"), hint: t("uploadHint") }}
            onFiles={takeFiles}
          />
          <ul className="grid gap-2 text-sm text-[color:var(--ink)]/70 sm:grid-cols-3">
            <li className="rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
              {t("bulletWord")}
            </li>
            <li className="rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
              {t("bulletImages")}
            </li>
            <li className="rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
              {t("bulletPdfOut")}
            </li>
          </ul>
          <p className="text-xs text-[color:var(--ink)]/50">
            {t("alsoSee")}{" "}
            <Link href="/tools/pdf-to-word" className="text-[color:var(--accent)] underline">
              {t("linkPdfWord")}
            </Link>
            {" · "}
            <Link href="/tools/pdf-to-excel" className="text-[color:var(--accent)] underline">
              {t("linkPdfExcel")}
            </Link>
            {" · "}
            <Link href="/tools/word-to-pdf" className="text-[color:var(--accent)] underline">
              {t("linkWordPdf")}
            </Link>
            {" · "}
            <Link href="/tools/jpg-to-pdf" className="text-[color:var(--accent)] underline">
              {t("linkJpgPdf")}
            </Link>
          </p>
          <ErrorBanner message={error} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-wrap gap-3">
              {items.slice(0, 6).map((item) =>
                item.kind === "pdf" ? (
                  <PdfDocumentThumb key={item.id} file={item.file} className="aspect-[3/4] w-28" />
                ) : item.kind === "image" ? (
                  <ImageFileThumb key={item.id} file={item.file} className="aspect-[3/4] w-28" />
                ) : (
                  <div key={item.id}>{officeThumb(item.kind)}</div>
                ),
              )}
              {items.length > 6 ? (
                <div className="flex aspect-[3/4] w-28 items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] text-sm text-[color:var(--ink)]/50">
                  +{items.length - 6}
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="truncate text-sm font-medium text-[color:var(--accent)]">
                  {items.length === 1 ? items[0].file.name : t("filesCount", { count: items.length })}
                </p>
                <p className="text-xs text-[color:var(--ink)]/55">
                  {items.length === 1
                    ? formatFileSize(items[0].file.size)
                    : formatFileSize(items.reduce((s, i) => s + i.file.size, 0))}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--ink)]/45">
                  {t("convertTo")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {available.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setTarget(fmt)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        target === fmt
                          ? "bg-[color:var(--accent)] !text-white"
                          : "border border-[color:var(--line)] hover:border-[color:var(--accent)]"
                      }`}
                    >
                      {targetLabel(fmt)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                className="text-xs text-[color:var(--ink)]/50 underline hover:text-red-700"
              >
                {tCommon("remove")}
              </button>
            </div>
          </div>
          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onConvert} disabled={downloading}>
            {downloading ? tCommon("processing") : t("convertDownload")}
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

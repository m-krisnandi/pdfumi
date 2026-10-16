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
import { SignaturePad } from "@/components/SignaturePad";

type Mode =
  | "protect"
  | "unlock"
  | "page-numbers"
  | "crop"
  | "sign";

const NS: Record<Mode, string> = {
  protect: "protectPdf",
  unlock: "unlockPdf",
  "page-numbers": "pageNumbersPdf",
  crop: "cropPdf",
  sign: "signPdf",
};

const ENDPOINT: Record<Mode, string> = {
  protect: "/api/v1/pdf/protect",
  unlock: "/api/v1/pdf/unlock",
  "page-numbers": "/api/v1/pdf/page-numbers",
  crop: "/api/v1/pdf/crop",
  sign: "/api/v1/pdf/sign",
};

export function ExtraPdfOpsBoard({ mode }: { mode: Mode }) {
  const t = useTranslations(NS[mode]);
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [drawnSignature, setDrawnSignature] = useState<string | undefined>();
  const [signMethod, setSignMethod] = useState<"draw" | "upload">("draw");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("bottom-center");
  const [format, setFormat] = useState("n");
  const [margin, setMargin] = useState(0.05);
  const [language, setLanguage] = useState("eng");
  const [sigX, setSigX] = useState(0.72);
  const [sigY, setSigY] = useState(0.82);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function takeFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setError(null);
  }

  function takeSignature(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !/\.(png|jpe?g|webp)$/i.test(f.name)) return;
    setSignature(f);
    setDrawnSignature(undefined);
    setError(null);
  }

  async function signatureFile(): Promise<File | null> {
    if (signMethod === "upload") return signature;
    if (!drawnSignature) return null;
    const res = await fetch(drawnSignature);
    const blob = await res.blob();
    return new File([blob], "signature.png", { type: "image/png" });
  }

  async function onDownload() {
    if (!file) {
      setError(t("needFile"));
      return;
    }
    if ((mode === "protect" || mode === "unlock") && !password.trim()) {
      setError(t("needPassword"));
      return;
    }
    let sig: File | null = null;
    if (mode === "sign") {
      sig = await signatureFile();
      if (!sig) {
        setError(signMethod === "draw" ? t("needDraw") : t("needSignature"));
        return;
      }
    }
    setDownloading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (mode === "protect" || mode === "unlock") form.append("password", password.trim());
    if (mode === "page-numbers") {
      form.append("position", position);
      form.append("format", format);
    }
    if (mode === "crop") {
      const m = String(margin);
      form.append("left", m);
      form.append("right", m);
      form.append("top", m);
      form.append("bottom", m);
    }
    if (mode === "sign" && sig) {
      form.append("signature", sig);
      form.append("x", String(sigX));
      form.append("y", String(sigY));
      form.append("width", "0.22");
      form.append("page", "0");
    }
    try {
      const res = await fetch(`${API_BASE}${ENDPOINT[mode]}`, {
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
    <ToolShell title={t("title")} description={t("description")}>
      {!file ? (
        <PdfDropzone
          labels={{ choose: t("chooseFile"), drop: t("dropHint"), hint: t("uploadHint") }}
          onFiles={takeFiles}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <PdfDocumentThumb file={file} className="aspect-[3/4] w-36" />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="truncate text-sm font-medium text-[color:var(--accent)]">{file.name}</p>
                <p className="text-xs text-[color:var(--ink)]/55">{formatFileSize(file.size)}</p>
              </div>

              {(mode === "protect" || mode === "unlock") && (
                <label className="block space-y-1 text-sm">
                  <span className="text-[color:var(--ink)]/70">{t("passwordLabel")}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full max-w-sm glass-input rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm"
                    autoComplete="new-password"
                  />
                </label>
              )}

              {mode === "page-numbers" && (
                <div className="flex flex-wrap gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="block text-[color:var(--ink)]/70">{t("positionLabel")}</span>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="glass-input rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm"
                    >
                      <option value="bottom-center">{t("posBottomCenter")}</option>
                      <option value="bottom-left">{t("posBottomLeft")}</option>
                      <option value="bottom-right">{t("posBottomRight")}</option>
                      <option value="top-center">{t("posTopCenter")}</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="block text-[color:var(--ink)]/70">{t("formatLabel")}</span>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="glass-input rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm"
                    >
                      <option value="n">{t("fmtN")}</option>
                      <option value="n-of-total">{t("fmtNOfTotal")}</option>
                    </select>
                  </label>
                </div>
              )}

              {mode === "crop" && (
                <label className="block max-w-sm space-y-1 text-sm">
                  <span className="text-[color:var(--ink)]/70">
                    {t("marginLabel")}: {Math.round(margin * 100)}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.25}
                    step={0.01}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              )}



              {mode === "sign" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "draw" as const, label: t("methodDraw") },
                        { id: "upload" as const, label: t("methodUpload") },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSignMethod(m.id);
                          setSignature(null);
                          setDrawnSignature(undefined);
                          setError(null);
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs transition ${
                          signMethod === m.id
                            ? "bg-[color:var(--accent)] !text-white"
                            : "border border-[color:var(--line)] hover:border-[color:var(--accent)]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {signMethod === "draw" ? (
                    <SignaturePad
                      value={drawnSignature}
                      labels={{ hint: t("drawHint"), clear: t("clearDraw") }}
                      onChange={(dataUrl) => {
                        setDrawnSignature(dataUrl);
                        setSignature(null);
                        setError(null);
                      }}
                    />
                  ) : (
                    <label className="block space-y-1 text-sm">
                      <span className="text-[color:var(--ink)]/70">{t("signatureLabel")}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        onChange={(e) => takeSignature(e.target.files)}
                        className="block w-full text-xs"
                      />
                      {signature ? (
                        <p className="text-xs text-[color:var(--ink)]/55">{signature.name}</p>
                      ) : (
                        <p className="text-xs text-[color:var(--ink)]/45">{t("uploadHintSig")}</p>
                      )}
                    </label>
                  )}

                  <div>
                    <p className="mb-1.5 text-xs text-[color:var(--ink)]/55">{t("positionHint")}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { x: 0.72, y: 0.82, label: t("presetBr") },
                        { x: 0.28, y: 0.82, label: t("presetBl") },
                        { x: 0.5, y: 0.5, label: t("presetCenter") },
                      ].map((p) => {
                        const active = Math.abs(sigX - p.x) < 0.01 && Math.abs(sigY - p.y) < 0.01;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              setSigX(p.x);
                              setSigY(p.y);
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                              active
                                ? "bg-[color:var(--accent)] !text-white"
                                : "border border-[color:var(--line)] hover:border-[color:var(--accent)]"
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setSignature(null);
                  setDrawnSignature(undefined);
                  setSignMethod("draw");
                  setPassword("");
                }}
                className="text-xs text-[color:var(--ink)]/50 underline hover:text-red-700"
              >
                {tCommon("remove")}
              </button>
            </div>
          </div>
          <ErrorBanner message={error} />
          <Button type="button" loading={downloading} onClick={onDownload} disabled={downloading}>
            {downloading ? tCommon("processing") : tCommon("downloadResult")}
          </Button>
        </div>
      )}
      {!file ? <ErrorBanner message={error} /> : null}
    </ToolShell>
  );
}

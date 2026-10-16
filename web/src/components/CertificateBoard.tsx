"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, responseToBlob } from "@/lib/api";
import { parseCertificateCsv, type CertificateRecipient } from "@/lib/certificateCsv";
import { formatLongDate } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfPreview } from "@/components/PdfPreview";
import { SignaturePad } from "@/components/SignaturePad";
import { TemplateThumb } from "@/components/TemplateThumb";
import {
  clearCertificateDraft,
  deleteSignature,
  listSignatures,
  loadCertificateDraft,
  loadSavedLogo,
  saveCertificateDraft,
  saveLogo,
  saveSignature,
  type SavedSignature,
} from "@/lib/certificateAssets";

const FREE_MAX = 20;
type TemplateId = "classic" | "modern" | "elegant";
type SigMode = "upload" | "draw";
type SignerDraft = {
  name: string;
  title: string;
  signatureBase64?: string;
  fileName?: string;
  mode: SigMode;
};

const TEMPLATES: TemplateId[] = ["classic", "modern", "elegant"];

const DEFAULT_COPY = {
  heading: "CERTIFICATE OF COMPLETION",
  certifyLine: "This is to certify that",
  participatedLine: "has successfully participated in",
};

export function CertificateBoard() {
  const t = useTranslations("certificate");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [heading, setHeading] = useState(DEFAULT_COPY.heading);
  const [certifyLine, setCertifyLine] = useState(DEFAULT_COPY.certifyLine);
  const [participatedLine, setParticipatedLine] = useState(DEFAULT_COPY.participatedLine);
  const [showWording, setShowWording] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [signerCount, setSignerCount] = useState<0 | 1 | 2 | 3>(1);
  const [signers, setSigners] = useState<SignerDraft[]>([
    { name: "", title: "", mode: "upload" },
    { name: "", title: "", mode: "upload" },
    { name: "", title: "", mode: "upload" },
  ]);
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>([]);
  const [recipients, setRecipients] = useState<CertificateRecipient[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = loadCertificateDraft();
    if (draft) {
      setEventTitle(draft.eventTitle || "");
      setOrganization(draft.organization || "");
      setEventDate(
        draft.eventDateIso
          ? new Date(
              Number(draft.eventDateIso.slice(0, 4)),
              Number(draft.eventDateIso.slice(5, 7)) - 1,
              Number(draft.eventDateIso.slice(8, 10)),
            )
          : null,
      );
      setHeading(draft.heading || DEFAULT_COPY.heading);
      setCertifyLine(draft.certifyLine || DEFAULT_COPY.certifyLine);
      setParticipatedLine(draft.participatedLine || DEFAULT_COPY.participatedLine);
      setShowWording(Boolean(draft.showWording));
      setTemplate(draft.template || "classic");
      setSignerCount(draft.signerCount ?? 1);
      if (Array.isArray(draft.signers) && draft.signers.length > 0) {
        const padded = [...draft.signers];
        while (padded.length < 3) padded.push({ name: "", title: "", mode: "upload" });
        setSigners(padded.slice(0, 3) as SignerDraft[]);
      }
      setRecipients(Array.isArray(draft.recipients) ? draft.recipients : []);
      setFileName(draft.fileName ?? null);
      if (draft.logoBase64) {
        setLogoBase64(draft.logoBase64);
        setLogoFileName(draft.logoFileName || "saved-logo");
      } else {
        const logo = loadSavedLogo();
        if (logo) {
          setLogoBase64(logo);
          setLogoFileName("saved-logo");
        }
      }
    } else {
      const logo = loadSavedLogo();
      if (logo) {
        setLogoBase64(logo);
        setLogoFileName("saved-logo");
      }
    }
    setSavedSigs(listSignatures());
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      saveCertificateDraft({
        eventTitle,
        organization,
        eventDateIso: eventDate
          ? `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`
          : null,
        logoBase64,
        logoFileName,
        heading,
        certifyLine,
        participatedLine,
        showWording,
        template,
        signerCount,
        signers,
        recipients,
        fileName,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    eventTitle,
    organization,
    eventDate,
    logoBase64,
    logoFileName,
    heading,
    certifyLine,
    participatedLine,
    showWording,
    template,
    signerCount,
    signers,
    recipients,
    fileName,
  ]);

  function resetDraft() {
    clearCertificateDraft();
    setEventTitle("");
    setOrganization("");
    setEventDate(null);
    setHeading(DEFAULT_COPY.heading);
    setCertifyLine(DEFAULT_COPY.certifyLine);
    setParticipatedLine(DEFAULT_COPY.participatedLine);
    setShowWording(false);
    setTemplate("classic");
    setSignerCount(1);
    setSigners([
      { name: "", title: "", mode: "upload" },
      { name: "", title: "", mode: "upload" },
      { name: "", title: "", mode: "upload" },
    ]);
    setRecipients([]);
    setFileName(null);
    setError(null);
    // keep logo + signature library — user may still want those
  }

  const validRecipients = useMemo(
    () => recipients.filter((r) => r.name.trim().length > 0),
    [recipients],
  );
  const overLimit = validRecipients.length > FREE_MAX;
  const canSubmit = eventTitle.trim().length > 0 && validRecipients.length > 0 && !overLimit;

  const sampleCsv = useMemo(
    () => "name,title\nAda Lovelace,Participant\nAlan Turing,Speaker\n",
    [],
  );

  const activeSigners = useMemo(() => {
    return signers.slice(0, signerCount).filter((s) => s.name.trim().length > 0);
  }, [signers, signerCount]);

  function buildPayload() {
    return {
      eventTitle: eventTitle.trim(),
      organization: organization.trim() || undefined,
      eventDate: eventDate ? formatLongDate(locale, eventDate) : undefined,
      template,
      heading: heading.trim() || undefined,
      certifyLine: certifyLine.trim() || undefined,
      participatedLine: participatedLine.trim() || undefined,
      logoBase64: logoBase64 || undefined,
      recipients: validRecipients.map((r) => ({
        name: r.name.trim(),
        title: r.title?.trim() || undefined,
      })),
      signers: activeSigners.map((s) => ({
        name: s.name.trim(),
        title: s.title.trim() || undefined,
        signatureBase64: s.signatureBase64 || undefined,
      })),
      withBrandFooter: false,
    };
  }

  useEffect(() => {
    if (!draftReady || !canSubmit) {
      setPreviewBlob(null);
      setPreviewing(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/certificates/preview`, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(buildPayload()),
        });
        const blob = await responseToBlob(res);
        if (!cancelled) setPreviewBlob(blob);
      } catch {
        if (!cancelled) setPreviewBlob(null);
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draftReady,
    canSubmit,
    eventTitle,
    organization,
    eventDate,
    template,
    heading,
    certifyLine,
    participatedLine,
    logoBase64,
    signerCount,
    signers,
    validRecipients,
    locale,
  ]);

  async function ingestCsv(file: File) {
    setError(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && file.type && !file.type.includes("csv") && file.type !== "text/plain") {
      setError(t("needCsv"));
      return;
    }
    const text = await file.text();
    const parsed = parseCertificateCsv(text);
    if (parsed.length === 0) {
      setError(t("emptyCsv"));
      return;
    }
    setRecipients(parsed);
    setFileName(file.name);
  }

  function onFiles(list: FileList | null) {
    const file = list?.[0];
    if (file) void ingestCsv(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function updateRecipient(index: number, patch: Partial<CertificateRecipient>) {
    setRecipients((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRecipient(index: number) {
    setRecipients((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setFileName(null);
      return next;
    });
  }

  function addRecipient() {
    if (recipients.length >= FREE_MAX) {
      setError(t("tooMany", { max: FREE_MAX }));
      return;
    }
    setRecipients((prev) => [...prev, { name: "", title: "" }]);
    setFileName((name) => name || t("manualList"));
    setError(null);
  }

  function clearRecipients() {
    setRecipients([]);
    setFileName(null);
    setError(null);
  }

  function updateSigner(index: number, patch: Partial<SignerDraft>) {
    setSigners((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSignatureFile(index: number, file: File | null) {
    if (!file) {
      updateSigner(index, { signatureBase64: undefined, fileName: undefined });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("needSignatureImage"));
      return;
    }
    if (file.size > 600_000) {
      setError(t("signatureTooLarge"));
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    updateSigner(index, { signatureBase64: dataUrl, fileName: file.name });
    setError(null);
  }

  async function onLogoFile(file: File | null) {
    if (!file) {
      setLogoBase64(undefined);
      setLogoFileName(null);
      saveLogo(undefined);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("needLogoImage"));
      return;
    }
    if (file.size > 600_000) {
      setError(t("logoTooLarge"));
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    setLogoBase64(dataUrl);
    setLogoFileName(file.name);
    saveLogo(dataUrl);
    setError(null);
  }

  function applySavedSignature(index: number, saved: SavedSignature) {
    updateSigner(index, {
      name: saved.name || signers[index]?.name || "",
      title: saved.title || signers[index]?.title || "",
      signatureBase64: saved.imageBase64,
      fileName: saved.label,
      mode: "upload",
    });
  }

  function persistSignerSignature(index: number) {
    const s = signers[index];
    if (!s?.signatureBase64) {
      setError(t("needSignatureToSave"));
      return;
    }
    const label = s.name.trim() || s.fileName || `Signer ${index + 1}`;
    saveSignature({
      label,
      name: s.name.trim() || undefined,
      title: s.title.trim() || undefined,
      imageBase64: s.signatureBase64,
    });
    setSavedSigs(listSignatures());
    setError(null);
  }

  function removeSavedSignature(id: string) {
    deleteSignature(id);
    setSavedSigs(listSignatures());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError(overLimit ? t("tooMany", { max: FREE_MAX }) : t("needRecipients"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/certificates`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(buildPayload()),
      });
      await downloadBlob(res, "certificates-pdfumi.pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] xl:items-start">
          <div className="space-y-5">
            <label className="block text-sm">
              <span className="mb-1 block text-[color:var(--ink)]/80">{t("fields.eventTitle")}</span>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
                placeholder={t("fields.eventTitlePlaceholder")}
                className="w-full rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[color:var(--ink)]/80">{t("fields.organization")}</span>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={t("fields.organizationPlaceholder")}
                className="w-full rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]"
              />
            </label>
            <div>
              <p className="mb-1 text-sm text-[color:var(--ink)]/80">{t("logoLabel")}</p>
              <div className="flex flex-wrap items-center gap-3">
                {logoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoBase64}
                    alt=""
                    className="h-12 w-12 rounded-lg border border-[color:var(--line)] object-contain bg-white"
                  />
                ) : null}
                <label className="cursor-pointer rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-xs text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]">
                  {logoFileName ? t("logoSelected", { name: logoFileName }) : t("uploadLogo")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => void onLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
                {logoBase64 ? (
                  <button
                    type="button"
                    onClick={() => void onLogoFile(null)}
                    className="cursor-pointer text-xs text-[color:var(--ink)]/50 hover:text-[color:var(--accent)]"
                  >
                    {tCommon("remove")}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-[color:var(--ink)]/45">{t("logoHint")}</p>
            </div>
            <DateField
              label={t("fields.eventDate")}
              value={eventDate}
              onChange={setEventDate}
              placeholder={formatLongDate(locale, new Date())}
            />

            <div>
              <button
                type="button"
                onClick={() => setShowWording((v) => !v)}
                className="mb-2 flex w-full cursor-pointer items-center justify-between text-sm text-[color:var(--ink)]/80"
              >
                <span>{t("wordingLabel")}</span>
                <span className="text-xs text-[color:var(--accent)]">
                  {showWording ? t("wordingHide") : t("wordingShow")}
                </span>
              </button>
              {showWording ? (
                <div className="space-y-2 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 p-3.5">
                  <input
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    placeholder={DEFAULT_COPY.heading}
                    className="w-full rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                  />
                  <input
                    value={certifyLine}
                    onChange={(e) => setCertifyLine(e.target.value)}
                    placeholder={DEFAULT_COPY.certifyLine}
                    className="w-full rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                  />
                  <input
                    value={participatedLine}
                    onChange={(e) => setParticipatedLine(e.target.value)}
                    placeholder={DEFAULT_COPY.participatedLine}
                    className="w-full rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-sm text-[color:var(--ink)]/80">{t("signersLabel")}</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {([0, 1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSignerCount(n)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      signerCount === n
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] !text-white"
                        : "border-[color:var(--line)] bg-white text-[color:var(--ink)]/70 hover:border-[color:var(--accent)]"
                    }`}
                  >
                    {t(`signerCount.${n}`)}
                  </button>
                ))}
              </div>
              {signerCount > 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: signerCount }).map((_, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 p-3.5"
                    >
                      <p className="text-xs font-medium text-[color:var(--ink)]/50">
                        {t("signerN", { n: i + 1 })}
                      </p>
                      <input
                        value={signers[i]?.name || ""}
                        onChange={(e) => updateSigner(i, { name: e.target.value })}
                        placeholder={t("fields.signerNamePlaceholder")}
                        className="w-full rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                      />
                      <input
                        value={signers[i]?.title || ""}
                        onChange={(e) => updateSigner(i, { title: e.target.value })}
                        placeholder={t("fields.signerTitlePlaceholder")}
                        className="w-full rounded-lg border border-[color:var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                      />
                      <div className="flex gap-2">
                        {(["upload", "draw"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              updateSigner(i, {
                                mode,
                                signatureBase64: undefined,
                                fileName: undefined,
                              })
                            }
                            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                              signers[i]?.mode === mode
                                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                                : "border-[color:var(--line)] bg-white text-[color:var(--ink)]/60"
                            }`}
                          >
                            {t(mode === "upload" ? "sigModeUpload" : "sigModeDraw")}
                          </button>
                        ))}
                      </div>
                      {signers[i]?.mode === "draw" ? (
                        <SignaturePad
                          value={signers[i]?.signatureBase64}
                          onChange={(dataUrl) =>
                            updateSigner(i, {
                              signatureBase64: dataUrl,
                              fileName: dataUrl ? "drawn-signature.png" : undefined,
                            })
                          }
                        />
                      ) : (
                        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-dashed border-[color:var(--line)] bg-white px-2.5 py-2 text-xs text-[color:var(--ink)]/60 hover:border-[color:var(--accent)]">
                          <span>
                            {signers[i]?.fileName
                              ? t("signatureSelected", { name: signers[i].fileName! })
                              : t("uploadSignature")}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(e) => void onSignatureFile(i, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                      {signers[i]?.signatureBase64 ? (
                        <button
                          type="button"
                          onClick={() => persistSignerSignature(i)}
                          className="cursor-pointer text-xs text-[color:var(--accent)] hover:underline"
                        >
                          {t("saveSignatureToLibrary")}
                        </button>
                      ) : null}
                      {savedSigs.length > 0 ? (
                        <div className="space-y-1.5 border-t border-[color:var(--line)] pt-2">
                          <p className="text-[11px] text-[color:var(--ink)]/50">{t("signatureLibrary")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {savedSigs.map((saved) => (
                              <div
                                key={saved.id}
                                className="flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-white pl-1 pr-2 py-0.5"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={saved.imageBase64}
                                  alt=""
                                  className="h-6 w-10 rounded object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => applySavedSignature(i, saved)}
                                  className="cursor-pointer text-[11px] text-[color:var(--accent)] hover:underline"
                                >
                                  {saved.label}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSavedSignature(saved.id)}
                                  className="cursor-pointer text-[10px] text-[color:var(--ink)]/35 hover:text-red-700"
                                  aria-label={tCommon("remove")}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[color:var(--ink)]/50">{t("noSignersHint")}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm text-[color:var(--ink)]/80">{t("csvLabel")}</p>
              {recipients.length === 0 ? (
                <div className="space-y-3">
                  <label
                    htmlFor={fileId}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      onFiles(e.dataTransfer.files);
                    }}
                    className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-7 text-center transition ${
                      dragging
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-zinc-300/80 dark:border-white/15 bg-white/40 dark:bg-white/[0.03] hover:border-teal-500 hover:bg-teal-500/[0.04]"
                    }`}
                  >
                    <span className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium !text-white">
                      {t("chooseCsv")}
                    </span>
                    <span className="text-sm text-[color:var(--ink)]/70">{t("dropHint")}</span>
                    <input
                      id={fileId}
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      className="sr-only"
                      onChange={(e) => onFiles(e.target.files)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="w-full cursor-pointer rounded-xl border border-[color:var(--line)] bg-white px-3 py-2.5 text-sm text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]"
                  >
                    {t("addManually")}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl glass-card border border-zinc-200/80 dark:border-white/10 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[color:var(--ink)]/80">
                      {fileName || t("recipientsLoaded")} ·{" "}
                      <span className={overLimit ? "text-red-700" : ""}>
                        {t("recipientCount", { count: validRecipients.length, max: FREE_MAX })}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={addRecipient}
                        className="cursor-pointer text-sm text-[color:var(--accent)] hover:underline"
                      >
                        {t("addRow")}
                      </button>
                      <label
                        htmlFor={fileId}
                        className="cursor-pointer text-sm text-[color:var(--accent)] hover:underline"
                      >
                        {t("replaceCsv")}
                        <input
                          id={fileId}
                          ref={fileRef}
                          type="file"
                          accept=".csv,text/csv,text/plain"
                          className="sr-only"
                          onChange={(e) => onFiles(e.target.files)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearRecipients}
                        className="cursor-pointer text-sm text-[color:var(--ink)]/50 hover:text-[color:var(--accent)]"
                      >
                        {tCommon("clear")}
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-52 space-y-2 overflow-auto pr-1">
                    {recipients.map((r, i) => (
                      <li key={i} className="rounded-xl border border-[color:var(--line)] bg-white p-2.5">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs text-[color:var(--ink)]/40">{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeRecipient(i)}
                            className="cursor-pointer text-xs text-[color:var(--ink)]/45 hover:text-red-700"
                          >
                            {tCommon("remove")}
                          </button>
                        </div>
                        <input
                          value={r.name}
                          onChange={(e) => updateRecipient(i, { name: e.target.value })}
                          placeholder={t("fields.namePlaceholder")}
                          className="mb-1.5 w-full rounded-lg border border-[color:var(--line)] px-2 py-1.5 text-sm font-medium outline-none focus:border-[color:var(--accent)]"
                        />
                        <input
                          value={r.title || ""}
                          onChange={(e) => updateRecipient(i, { title: e.target.value })}
                          placeholder={t("fields.titlePlaceholder")}
                          className="w-full rounded-lg border border-[color:var(--line)] px-2 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-2 text-xs text-[color:var(--ink)]/50">
                {t("csvFormat")}{" "}
                <button
                  type="button"
                  className="cursor-pointer text-[color:var(--accent)] hover:underline"
                  onClick={() => {
                    const blob = new Blob([sampleCsv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "certificate-sample.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  {t("downloadSample")}
                </button>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-[color:var(--ink)]/80">{t("templateLabel")}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {TEMPLATES.map((id) => (
                  <TemplateThumb
                    key={id}
                    id={id}
                    selected={template === id}
                    title={t(`templates.${id}`)}
                    description={t(`templates.${id}Desc`)}
                    onSelect={() => setTemplate(id)}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[#f7f5f0]">
              <div className="border-b border-[color:var(--line)] px-4 py-3">
                <h2 className="font-[family-name:var(--font-display)] text-xl">{t("livePreviewTitle")}</h2>
                <p className="mt-1 text-sm text-[color:var(--ink)]/60">{t("livePreviewHint")}</p>
              </div>
              <div className="p-3 sm:p-4">
                {!canSubmit ? (
                  <div className="flex min-h-[22rem] items-center justify-center text-sm text-[color:var(--ink)]/50">
                    {t("previewEmpty")}
                  </div>
                ) : previewing && !previewBlob ? (
                  <div className="flex min-h-[22rem] items-center justify-center text-sm text-[color:var(--ink)]/50">
                    {tCommon("processing")}
                  </div>
                ) : previewBlob ? (
                  <PdfPreview
                    file={previewBlob}
                    title={t("livePreviewTitle")}
                    className="min-h-[20rem]"
                  />
                ) : (
                  <div className="flex min-h-[22rem] items-center justify-center text-sm text-[color:var(--ink)]/50">
                    {t("previewFailed")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading} disabled={!canSubmit}>
            {loading ? tCommon("processing") : t("downloadAll")}
          </Button>
          <button
            type="button"
            onClick={resetDraft}
            className="cursor-pointer rounded-full border border-[color:var(--line)] bg-white px-4 py-2.5 text-sm text-[color:var(--ink)]/70 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          >
            {t("clearDraft")}
          </button>
          <p className="text-xs text-[color:var(--ink)]/50">{t("draftHint")}</p>
        </div>
      </form>
    </ToolShell>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

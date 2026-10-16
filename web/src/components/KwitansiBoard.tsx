"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { API_BASE, authHeaders, downloadBlob, responseToBlob } from "@/lib/api";
import { formatLongDate, startOfDay } from "@/lib/dates";
import { loadSavedLogo, saveLogo } from "@/lib/certificateAssets";
import {
  clearReceiptDraft,
  fromDateIso,
  loadReceiptDraft,
  saveReceiptDraft,
  toDateIso,
} from "@/lib/receiptDraft";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DateField } from "@/components/ui/DateField";
import { ToolShell } from "@/components/ToolShell";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PdfPreview } from "@/components/PdfPreview";
import { SignaturePad } from "@/components/SignaturePad";

export function KwitansiBoard() {
  const t = useTranslations("receipt");
  const tCommon = useTranslations("common");
  const tCert = useTranslations("certificate");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  const [nomor, setNomor] = useState("");
  const [diterimaDari, setDiterimaDari] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [untukPembayaran, setUntukPembayaran] = useState("");
  const [kota, setKota] = useState("");
  const [tanggal, setTanggal] = useState<Date | null>(() => startOfDay(new Date()));
  const [penerimaNama, setPenerimaNama] = useState("");
  const [organization, setOrganization] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | undefined>();
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | undefined>();
  const [signatureFileName, setSignatureFileName] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"upload" | "draw">("upload");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const now = new Date();
  const numberPlaceholder = t("fields.numberPlaceholder", {
    mm: String(now.getMonth() + 1).padStart(2, "0"),
    yyyy: String(now.getFullYear()),
  });

  const canPreview = useMemo(() => {
    const amount = Number(jumlah);
    return (
      diterimaDari.trim().length > 0 &&
      untukPembayaran.trim().length > 0 &&
      Number.isFinite(amount) &&
      amount >= 1
    );
  }, [diterimaDari, jumlah, untukPembayaran]);

  useEffect(() => {
    const draft = loadReceiptDraft();
    if (draft) {
      setNomor(draft.nomor || "");
      setDiterimaDari(draft.diterimaDari || "");
      setJumlah(draft.jumlah || "");
      setUntukPembayaran(draft.untukPembayaran || "");
      setKota(draft.kota || "");
      setTanggal(fromDateIso(draft.tanggalIso) ?? startOfDay(new Date()));
      setPenerimaNama(draft.penerimaNama || "");
      setOrganization(draft.organization || "");
      setSignatureMode(draft.signatureMode || "upload");
      if (draft.signatureBase64) {
        setSignatureBase64(draft.signatureBase64);
        setSignatureFileName(draft.signatureFileName || "signature");
      }
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
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      saveReceiptDraft({
        nomor,
        diterimaDari,
        jumlah,
        untukPembayaran,
        kota,
        tanggalIso: toDateIso(tanggal),
        penerimaNama,
        organization,
        logoBase64,
        logoFileName,
        signatureBase64,
        signatureFileName,
        signatureMode,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    nomor,
    diterimaDari,
    jumlah,
    untukPembayaran,
    kota,
    tanggal,
    penerimaNama,
    organization,
    logoBase64,
    logoFileName,
    signatureBase64,
    signatureFileName,
    signatureMode,
  ]);

  function buildPayload() {
    return {
      nomor,
      diterimaDari,
      jumlah: Number(jumlah || 0),
      untukPembayaran,
      kota,
      tanggal: tanggal ? formatLongDate(locale, tanggal) : "",
      penerimaNama,
      organization: organization || undefined,
      logoBase64: logoBase64 || undefined,
      signatureBase64: signatureBase64 || undefined,
      withBrandFooter: true,
    };
  }

  useEffect(() => {
    if (!draftReady || !canPreview) {
      setPreviewBlob(null);
      setPreviewing(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/kwitansi/preview`, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(buildPayload()),
        });
        const blob = await responseToBlob(res);
        if (!cancelled) {
          setPreviewBlob(blob);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewBlob(null);
          setError(err instanceof Error ? err.message : t("previewFailed"));
        }
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
    canPreview,
    nomor,
    diterimaDari,
    jumlah,
    untukPembayaran,
    kota,
    tanggal,
    penerimaNama,
    organization,
    logoBase64,
    signatureBase64,
    locale,
  ]);

  function resetDraft() {
    clearReceiptDraft();
    setNomor("");
    setDiterimaDari("");
    setJumlah("");
    setUntukPembayaran("");
    setKota("");
    setTanggal(startOfDay(new Date()));
    setPenerimaNama("");
    setOrganization("");
    setSignatureBase64(undefined);
    setSignatureFileName(null);
    setSignatureMode("upload");
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

  async function onSignatureFile(file: File | null) {
    if (!file) {
      setSignatureBase64(undefined);
      setSignatureFileName(null);
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
    setSignatureBase64(dataUrl);
    setSignatureFileName(file.name);
    setError(null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canPreview) {
      setError(t("needRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/kwitansi`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(buildPayload()),
      });
      await downloadBlob(res, "kwitansi-pdfumi.pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell title={t("title")} description={t("description")} wide>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] xl:items-start">
          <div className="space-y-4">
            <Field
              name="organization"
              label={t("fields.organization")}
              placeholder={t("fields.organizationPlaceholder")}
              value={organization}
              onChange={setOrganization}
            />
            <div>
              <p className="mb-1 text-sm text-[color:var(--ink)]/80">{t("logoLabel")}</p>
              <div className="flex flex-wrap items-center gap-3">
                {logoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoBase64}
                    alt=""
                    className="h-12 w-12 rounded-lg border border-[color:var(--line)] bg-white object-contain"
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

            <Field
              name="nomor"
              label={t("fields.number")}
              placeholder={numberPlaceholder}
              value={nomor}
              onChange={setNomor}
            />
            <Field
              name="diterimaDari"
              label={t("fields.receivedFrom")}
              placeholder={t("fields.receivedFromPlaceholder")}
              required
              value={diterimaDari}
              onChange={setDiterimaDari}
            />
            <Field
              name="jumlah"
              label={t("fields.amount")}
              type="number"
              placeholder={t("fields.amountPlaceholder")}
              required
              value={jumlah}
              onChange={setJumlah}
            />
            <Field
              name="untukPembayaran"
              label={t("fields.forPayment")}
              placeholder={t("fields.forPaymentPlaceholder")}
              required
              value={untukPembayaran}
              onChange={setUntukPembayaran}
            />
            <Field
              name="kota"
              label={t("fields.city")}
              placeholder={t("fields.cityPlaceholder")}
              value={kota}
              onChange={setKota}
            />
            <DateField
              label={t("fields.date")}
              value={tanggal}
              onChange={setTanggal}
              placeholder={formatLongDate(locale, now)}
            />
            <Field
              name="penerimaNama"
              label={t("fields.payee")}
              placeholder={t("fields.payeePlaceholder")}
              value={penerimaNama}
              onChange={setPenerimaNama}
            />

            <div>
              <p className="mb-2 text-sm text-[color:var(--ink)]/80">{t("signatureLabel")}</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {(["upload", "draw"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSignatureMode(mode)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                      signatureMode === mode
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                        : "border-[color:var(--line)] bg-white text-[color:var(--ink)]/65 hover:border-[color:var(--accent)]"
                    }`}
                  >
                    {tCert(mode === "upload" ? "sigModeUpload" : "sigModeDraw")}
                  </button>
                ))}
              </div>
              {signatureMode === "draw" ? (
                <SignaturePad
                  value={signatureBase64}
                  onChange={(dataUrl) => {
                    setSignatureBase64(dataUrl);
                    setSignatureFileName(dataUrl ? "drawn-signature" : null);
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300/80 dark:border-white/15 bg-white/40 dark:bg-white/[0.03] px-4 py-6 text-center text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 transition hover:border-teal-500 hover:bg-teal-500/[0.04]">
                    {signatureFileName || t("uploadSignature")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => void onSignatureFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {signatureBase64 ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signatureBase64}
                        alt=""
                        className="h-10 max-w-[8rem] object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => void onSignatureFile(null)}
                        className="cursor-pointer text-xs text-[color:var(--ink)]/50 hover:text-[color:var(--accent)]"
                      >
                        {tCommon("remove")}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
              <p className="mt-1 text-[11px] text-[color:var(--ink)]/45">{t("signatureHint")}</p>
            </div>
          </div>

          <div className="xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[#f7f6f2]">
              <div className="border-b border-[color:var(--line)] px-4 py-3">
                <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                  {t("livePreviewTitle")}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--ink)]/55">{t("livePreviewHint")}</p>
              </div>
              <div className="p-3 sm:p-4">
                {!canPreview ? (
                  <div className="flex min-h-[18rem] items-center justify-center px-6 text-center text-sm text-[color:var(--ink)]/50">
                    {t("previewEmpty")}
                  </div>
                ) : previewing && !previewBlob ? (
                  <div className="flex min-h-[18rem] items-center justify-center text-sm text-[color:var(--ink)]/50">
                    {tCommon("processing")}
                  </div>
                ) : previewBlob ? (
                  <PdfPreview
                    file={previewBlob}
                    title={t("livePreviewTitle")}
                    className="min-h-[16rem]"
                  />
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center text-sm text-[color:var(--ink)]/50">
                    {t("previewFailed")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ErrorBanner message={error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading} disabled={!canPreview}>
            {loading ? tCommon("processing") : tCommon("downloadPdf")}
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
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

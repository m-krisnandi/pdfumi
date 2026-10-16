const SIG_KEY = "pdfumi.signatureLibrary.v1";
const LOGO_KEY = "pdfumi.orgLogo.v1";
const DRAFT_KEY = "pdfumi.certificateDraft.v1";

export type SavedSignature = {
  id: string;
  label: string;
  name?: string;
  title?: string;
  imageBase64: string;
  updatedAt: string;
};

export type CertificateDraft = {
  eventTitle: string;
  organization: string;
  eventDateIso: string | null;
  logoBase64?: string;
  logoFileName?: string | null;
  heading: string;
  certifyLine: string;
  participatedLine: string;
  showWording: boolean;
  template: "classic" | "modern" | "elegant";
  signerCount: 0 | 1 | 2 | 3;
  signers: Array<{
    name: string;
    title: string;
    signatureBase64?: string;
    fileName?: string;
    mode: "upload" | "draw";
  }>;
  recipients: Array<{ name: string; title?: string }>;
  fileName: string | null;
  updatedAt: string;
};

export function listSignatures(): SavedSignature[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSignature[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSignature(entry: Omit<SavedSignature, "id" | "updatedAt"> & { id?: string }) {
  const list = listSignatures();
  const id = entry.id || crypto.randomUUID();
  const next: SavedSignature = {
    id,
    label: entry.label.trim() || "Signature",
    name: entry.name,
    title: entry.title,
    imageBase64: entry.imageBase64,
    updatedAt: new Date().toISOString(),
  };
  const without = list.filter((s) => s.id !== id);
  without.unshift(next);
  localStorage.setItem(SIG_KEY, JSON.stringify(without.slice(0, 20)));
  return next;
}

export function deleteSignature(id: string) {
  const next = listSignatures().filter((s) => s.id !== id);
  localStorage.setItem(SIG_KEY, JSON.stringify(next));
}

export function loadSavedLogo(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(LOGO_KEY) || undefined;
}

export function saveLogo(dataUrl: string | undefined) {
  if (typeof window === "undefined") return;
  if (!dataUrl) {
    localStorage.removeItem(LOGO_KEY);
    return;
  }
  localStorage.setItem(LOGO_KEY, dataUrl);
}

export function loadCertificateDraft(): CertificateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CertificateDraft;
  } catch {
    return null;
  }
}

export function saveCertificateDraft(draft: Omit<CertificateDraft, "updatedAt">) {
  if (typeof window === "undefined") return;
  const next: CertificateDraft = { ...draft, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded (large images) — ignore
  }
}

export function clearCertificateDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

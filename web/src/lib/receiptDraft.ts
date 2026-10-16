const DRAFT_KEY = "pdfumi.receiptDraft.v1";

export type ReceiptDraft = {
  nomor: string;
  diterimaDari: string;
  jumlah: string;
  untukPembayaran: string;
  kota: string;
  tanggalIso: string | null;
  penerimaNama: string;
  organization: string;
  logoBase64?: string;
  logoFileName?: string | null;
  signatureBase64?: string;
  signatureFileName?: string | null;
  signatureMode: "upload" | "draw";
  updatedAt: string;
};

export function loadReceiptDraft(): ReceiptDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReceiptDraft;
  } catch {
    return null;
  }
}

export function saveReceiptDraft(draft: Omit<ReceiptDraft, "updatedAt">) {
  if (typeof window === "undefined") return;
  try {
    const next: ReceiptDraft = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function clearReceiptDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function toDateIso(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function fromDateIso(iso: string | null): Date | null {
  if (!iso || iso.length < 10) return null;
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

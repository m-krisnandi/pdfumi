import { authHeaders } from "@/lib/apiKey";
import { filenameFromContentDisposition } from "@/lib/downloadName";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8088";

export { authHeaders, loadApiKey, saveApiKey, loadSessionToken, saveSessionToken, isSignedIn } from "@/lib/apiKey";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(authHeaders(init.headers));
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function downloadBlob(res: Response, fallbackName: string) {
  const blob = await responseToBlob(res);
  const fromHeader = filenameFromContentDisposition(res.headers.get("Content-Disposition"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fromHeader || fallbackName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function responseToBlob(res: Response) {
  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.blob();
}

export async function toApiError(res: Response): Promise<ApiError> {
  const requestId = res.headers.get("X-Request-Id") || undefined;
  try {
    const data = await res.json();
    const message = data.detail || data.message || "Gagal memproses";
    return new ApiError(message, res.status, data.code || data.error, requestId);
  } catch {
    return new ApiError("Gagal memproses", res.status, undefined, requestId);
  }
}

/** Map low-level fetch failures or backend validation messages to localized UI messages. */
export function friendlyError(err: unknown, fallback: string, locale?: string): string {
  if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
    if (locale === "id") return "Tidak dapat terhubung ke server Pdfumi. Silakan periksa koneksi internet Anda.";
    if (locale === "ja") return "サーバーに接続できません。インターネット接続をご確認ください。";
    if (locale === "my") return "ဆာဗာသို့ ချိတ်ဆက်၍မရပါ။ အင်တာနက်လိုင်းကို စစ်ဆေးပါ။";
    return "Cannot reach the API server. Please check your network connection.";
  }
  if (err instanceof Error && err.message) {
    const msg = err.message;

    // Detect browser locale fallback if not passed explicitly
    const curLocale = locale || (typeof document !== "undefined" ? document.documentElement.lang : "en");

    const maxPageMatch = msg.match(/maksimal\s*(\d+)\s*halaman/i);
    if (maxPageMatch) {
      const num = maxPageMatch[1];
      if (curLocale === "en") return `Maximum ${num} pages allowed`;
      if (curLocale === "ja") return `最大 ${num} ページまでです`;
      if (curLocale === "my") return `စာမျက်နှာ ${num} အများဆုံးသာ ခွင့်ပြုပါသည်`;
      return `Maksimal ${num} halaman`;
    }

    const maxFilesMatch = msg.match(/maksimal\s*(\d+)\s*file/i);
    if (maxFilesMatch) {
      const num = maxFilesMatch[1];
      if (curLocale === "en") return `Maximum ${num} files allowed`;
      if (curLocale === "ja") return `最大 ${num} ファイルまでです`;
      if (curLocale === "my") return `ဖိုင် ${num} ခု အများဆုံးသာ ခွင့်ပြုပါသည်`;
      return `Maksimal ${num} file`;
    }

    if (/endpoint tidak ditemukan|not found|404/i.test(msg)) {
      if (curLocale === "en") return "Service is currently being updated. Please try again shortly.";
      if (curLocale === "ja") return "サービスは現在更新中です。しばらくしてからもう一度お試しください。";
      if (curLocale === "my") return "ဝန်ဆောင်မှုကို မွမ်းမံနေပါသည်။ ခေတ္တစောင့်ပြီး ထပ်မံကြိုးစားပါ။";
      return "Layanan sedang dalam proses pembaruan. Silakan coba beberapa saat lagi.";
    }

    if (/pilih minimal 1 halaman/i.test(msg)) {
      if (curLocale === "en") return "Please select at least 1 page";
      if (curLocale === "ja") return "少なくとも1ページ選択してください";
      if (curLocale === "my") return "အနည်းဆုံး စာမျက်နှာ ၁ မျက်နှာ ရွေးချယ်ပါ";
      return "Pilih minimal 1 halaman";
    }

    if (/pdf kosong/i.test(msg)) {
      if (curLocale === "en") return "The uploaded PDF is empty";
      if (curLocale === "ja") return "PDFが空です";
      if (curLocale === "my") return "PDF ဖိုင် ဗလာဖြစ်နေပါသည်";
      return "PDF kosong";
    }

    if (/ukuran file|maksimal.*mb/i.test(msg)) {
      if (curLocale === "en") return "File size exceeds the limit";
      if (curLocale === "ja") return "ファイルサイズが上限を超えています";
      if (curLocale === "my") return "ဖိုင်အရွယ်အစား ကန့်သတ်ချက်ထက် ကျော်လွန်နေပါသည်";
      return "Ukuran file melebihi batas";
    }

    if (/judul.*wajib diisi|subjek.*wajib diisi/i.test(msg)) {
      if (curLocale === "en") return "Subject / title is required";
      if (curLocale === "ja") return "件名は必須です";
      if (curLocale === "my") return "ခေါင်းစဉ် ထည့်သွင်းရန် လိုအပ်ပါသည်";
      return "Judul / subjek laporan wajib diisi";
    }

    if (/deskripsi.*wajib diisi/i.test(msg)) {
      if (curLocale === "en") return "Description is required";
      if (curLocale === "ja") return "詳細な説明は必須です";
      if (curLocale === "my") return "ဖော်ပြချက် ထည့်သွင်းရန် လိုအပ်ပါသည်";
      return "Deskripsi laporan wajib diisi";
    }

    return msg;
  }
  return fallback;
}

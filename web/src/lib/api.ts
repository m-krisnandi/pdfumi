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

/** Map low-level fetch failures to a clearer message for the UI. */
export function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof TypeError && /fetch|network|failed/i.test(err.message)) {
    return "Cannot reach the API (is the Pdfumi server running on :8088?).";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const API_KEY_STORAGE = "pdfumi.apiKey.v1";
const SESSION_STORAGE = "pdfumi.session.v1";
export const AUTH_CHANGE_EVENT = "pdfumi-auth-change";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function loadApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function saveApiKey(key: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (!key) {
      localStorage.removeItem(API_KEY_STORAGE);
    } else {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    }
    emitAuthChange();
  } catch {
    // ignore
  }
}

export function loadSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_STORAGE);
  } catch {
    return null;
  }
}

export function saveSessionToken(token: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (!token) {
      localStorage.removeItem(SESSION_STORAGE);
    } else {
      localStorage.setItem(SESSION_STORAGE, token.trim());
    }
    emitAuthChange();
  } catch {
    // ignore
  }
}

export function isSignedIn(): boolean {
  return Boolean(loadSessionToken() || loadApiKey());
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const key = loadApiKey();
  const session = loadSessionToken();
  const headers: Record<string, string> = {};
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(extra)) {
      for (const [k, v] of extra) headers[k] = v;
    } else {
      Object.assign(headers, extra);
    }
  }
  if (key) headers["X-Api-Key"] = key;
  if (session) headers["X-Session-Token"] = session;
  return headers;
}

export type Branding = {
  displayName: string;
  tagline: string;
  logoMark: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
};

export type DomainContext = {
  ok: boolean;
  hostname: string | null;
  slug?: string;
  name?: string;
  branding?: Branding | null;
};

export type SessionUser = {
  email: string;
  name: string;
  profile?: string;
  preferredLanguage?: string;
};

export type Session = {
  accessToken: string;
  user: SessionUser;
  modules?: string[];
  tenant: { slug: string; name: string; database?: string };
  branding: Branding | null;
};

export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3100';
const API = API_BASE;
const SESSION_KEY = 'havectrl.session';
const LOCALE_KEY = 'havectrl.locale';

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadStoredLocale(): string | null {
  try {
    return sessionStorage.getItem(LOCALE_KEY);
  } catch {
    return null;
  }
}

export function saveStoredLocale(locale: string) {
  sessionStorage.setItem(LOCALE_KEY, locale);
}

export function loadDomainConfig() {
  return api<DomainContext>('/common/domain/config');
}

export async function fetchStoredFileBlob(fileId: string, token: string): Promise<{ blob: Blob; url: string; mime: string }> {
  const res = await fetch(`${API}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    mode: 'cors',
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const msg = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message;
      throw new Error(msg || text || res.statusText);
    } catch (err) {
      if (err instanceof Error && err.message && err.message !== text) throw err;
      throw new Error(text || res.statusText);
    }
  }
  const blob = await res.blob();
  const mime = blob.type || res.headers.get('content-type') || 'application/octet-stream';
  return { blob, url: URL.createObjectURL(blob), mime };
}

export async function uploadFile<T>(path: string, token: string, form: FormData): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    mode: 'cors',
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const msg = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message;
      throw new Error(msg || text);
    } catch (err) {
      if (err instanceof Error && err.message && err.message !== text) throw err;
      throw new Error(text || res.statusText);
    }
  }
  return res.json() as Promise<T>;
}

export async function api<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const hasBody = init?.body != null && init.body !== '';
  if (hasBody && headers['Content-Type'] == null && headers['content-type'] == null) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API}${path}`, { ...init, headers, mode: 'cors' });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const msg = Array.isArray(parsed.message) ? parsed.message.join(' ') : parsed.message;
      throw new Error(msg || text);
    } catch (err) {
      if (err instanceof Error && err.message && err.message !== text) throw err;
      throw new Error(text || res.statusText);
    }
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

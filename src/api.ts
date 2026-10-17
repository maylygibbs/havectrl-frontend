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

export type SessionUser = { email: string; name: string; profile?: string };

export type Session = {
  accessToken: string;
  user: SessionUser;
  modules?: string[];
  tenant: { slug: string; name: string; database?: string };
  branding: Branding | null;
};

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3100';
const SESSION_KEY = 'havectrl.session';

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

export function loadDomainConfig() {
  return api<DomainContext>('/common/domain/config');
}

export async function api<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
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
  return res.json() as Promise<T>;
}

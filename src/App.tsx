import { FormEvent, useEffect, useState } from 'react';
import {
  api,
  Branding,
  clearSession,
  DomainContext,
  loadDomainConfig,
  loadSession,
  loadStoredLocale,
  saveSession,
  saveStoredLocale,
  Session,
} from './api';
import { isLocale, Locale, t } from './i18n/catalog';
import { Workspace } from './Workspace';

function applyBranding(branding: Branding | null | undefined) {
  const root = document.documentElement;
  if (!branding) {
    root.style.removeProperty('--tenant');
    root.style.removeProperty('--tenant-accent');
    document.title = 'HAVECTRL';
    return;
  }
  root.style.setProperty('--tenant', branding.primaryColor);
  root.style.setProperty('--tenant-accent', branding.accentColor);
  document.title = `${branding.displayName} · HAVECTRL`;
}

function resolveLocale(session: Session | null): Locale {
  const fromUser = session?.user.preferredLanguage;
  if (isLocale(fromUser)) return fromUser;
  const stored = loadStoredLocale();
  if (isLocale(stored)) return stored;
  return 'en';
}

export function App() {
  const [domain, setDomain] = useState<DomainContext | null>(null);
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [me, setMe] = useState<Session | null>(null);
  const [locale, setLocale] = useState<Locale>(() => resolveLocale(loadSession()));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDomainConfig()
      .then((next) => {
        setDomain(next);
        applyBranding(next.branding);
      })
      .catch(() => setDomain({ ok: false, hostname: window.location.hostname }));
  }, []);

  useEffect(() => {
    if (!session) {
      setMe(null);
      return;
    }
    let stop = false;
    api<Session>('/auth/me', session.accessToken)
      .then((next) => {
        if (stop) return;
        setMe(next);
        applyBranding(next.branding ?? domain?.branding);
        if (isLocale(next.user.preferredLanguage)) {
          setLocale(next.user.preferredLanguage);
          saveStoredLocale(next.user.preferredLanguage);
        }
      })
      .catch(() => {
        if (stop) return;
        clearSession();
        setSession(null);
      });
    return () => {
      stop = true;
    };
  }, [session, domain?.branding]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!domain?.ok) return;
    const data = new FormData(event.currentTarget);
    setError('');
    setSubmitting(true);
    try {
      const next = await api<Session>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      });
      const preferred = isLocale(next.user.preferredLanguage) ? next.user.preferredLanguage : locale;
      next.user.preferredLanguage = preferred;
      saveSession(next);
      setSession(next);
      applyBranding(next.branding);
      setLocale(preferred);
      saveStoredLocale(preferred);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    clearSession();
    setSession(null);
    setMe(null);
    setError('');
    applyBranding(domain?.branding);
  }

  async function changeLocale(next: Locale) {
    setLocale(next);
    saveStoredLocale(next);
    const token = session?.accessToken;
    if (!token) return;
    try {
      await api('/settings/language', token, {
        method: 'PATCH',
        body: JSON.stringify({ language: next }),
      });
      const updated = { ...(me ?? session)!, user: { ...(me ?? session)!.user, preferredLanguage: next } };
      saveSession({ ...updated, accessToken: token });
      setMe(updated);
      setSession({ ...updated, accessToken: token });
    } catch {
      // Preference stays local if the account update fails.
    }
  }

  const branding = me?.branding ?? session?.branding ?? domain?.branding ?? null;
  const unknown = domain && !domain.ok;
  const copy = t(locale);

  if (!domain) {
    return (
      <main className="stage">
        <p className="status" role="status">
          {copy.identifyingDomain}
        </p>
      </main>
    );
  }

  if (unknown) {
    return (
      <main className="stage">
        <section className="card">
          <BrandMark branding={branding} />
          <h1>{copy.domainUnknownTitle}</h1>
          <p>{copy.domainUnknownBody.replace('{hostname}', domain.hostname ?? window.location.hostname)}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="stage">
        <form className="card" onSubmit={login}>
          <BrandMark branding={branding} />
          <p className="tenant-name">{branding?.displayName ?? domain.name}</p>
          <p className="tagline">{branding?.tagline || copy.taglineDefault}</p>
          <h1>{copy.signIn}</h1>
          <label htmlFor="locale">{copy.language}</label>
          <select
            id="locale"
            value={locale}
            onChange={(event) => {
              const next = event.target.value;
              if (isLocale(next)) {
                setLocale(next);
                saveStoredLocale(next);
              }
            }}
          >
            <option value="en">{copy.english}</option>
            <option value="es">{copy.spanish}</option>
          </select>
          <label htmlFor="email">{copy.email}</label>
          <input id="email" name="email" type="email" autoComplete="username" autoFocus required />
          <label htmlFor="password">{copy.password}</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit" disabled={submitting}>
            {submitting ? copy.entering : copy.enterAccount}
          </button>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </main>
    );
  }

  return (
    <Workspace
      token={session.accessToken}
      user={me?.user ?? session.user}
      modules={me?.modules ?? session.modules ?? []}
      tenant={me?.tenant ?? session.tenant}
      branding={branding}
      hostname={domain.hostname}
      locale={locale}
      onLocaleChange={changeLocale}
      onLogout={logout}
    />
  );
}

function BrandMark({ branding }: { branding: Branding | null }) {
  return (
    <div className="brand-row">
      <img className="logo" src="/logo-havectrl.png" alt="HAVECTRL" width={160} height={160} />
      <div>
        <p className="eyebrow">HAVECTRL</p>
        <p className="tagline muted">{branding?.displayName}</p>
      </div>
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import { api, Branding, clearSession, DomainContext, loadDomainConfig, loadSession, saveSession, Session } from './api';
import { Workspace } from './Workspace';

function applyBranding(branding: Branding | null | undefined) {
  const root = document.documentElement;
  if (!branding) {
    root.style.removeProperty('--tenant');
    root.style.removeProperty('--tenant-accent');
    document.title = 'HaveCtrl';
    return;
  }
  root.style.setProperty('--tenant', branding.primaryColor);
  root.style.setProperty('--tenant-accent', branding.accentColor);
  document.title = branding.displayName;
}

export function App() {
  const [domain, setDomain] = useState<DomainContext | null>(null);
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [me, setMe] = useState<Session | null>(null);
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
      saveSession(next);
      setSession(next);
      applyBranding(next.branding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar');
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

  const branding = me?.branding ?? session?.branding ?? domain?.branding ?? null;
  const unknown = domain && !domain.ok;

  if (!domain) {
    return (
      <main className="stage">
        <p className="status" role="status">
          Identificando el dominio…
        </p>
      </main>
    );
  }

  if (unknown) {
    return (
      <main className="stage">
        <section className="card">
          <p className="eyebrow">HaveCtrl</p>
          <h1>Dominio no registrado</h1>
          <p>
            El servidor no reconoce <strong>{domain.hostname ?? window.location.hostname}</strong>. Cada cliente entra por su
            propio subdominio.
          </p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="stage">
        <form className="card" onSubmit={login}>
          <div className="brand-row">
            <span className="mark" aria-hidden="true">
              {branding?.logoMark ?? 'HC'}
            </span>
            <div>
              <p className="eyebrow">{branding?.displayName ?? domain.name}</p>
              <p className="tagline">{branding?.tagline}</p>
            </div>
          </div>
          <h1>Entrar</h1>
          <label htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" autoComplete="username" autoFocus required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar a la cuenta'}
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
      modules={me?.modules ?? []}
      tenant={me?.tenant ?? session.tenant}
      branding={branding}
      hostname={domain.hostname}
      onLogout={logout}
    />
  );
}

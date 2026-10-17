import { FormEvent, useEffect, useState } from 'react';
import { api, Branding, SessionUser } from './api';

type ModuleId =
  | 'home'
  | 'crew'
  | 'aircraft'
  | 'flights'
  | 'operations'
  | 'maintenance'
  | 'sms'
  | 'communication'
  | 'library'
  | 'settings';

const NAV: { id: ModuleId; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'crew', label: 'Tripulación' },
  { id: 'aircraft', label: 'Aeronaves' },
  { id: 'flights', label: 'Vuelos' },
  { id: 'operations', label: 'Servicios' },
  { id: 'maintenance', label: 'Mantenimiento' },
  { id: 'sms', label: 'SMS' },
  { id: 'communication', label: 'Comunicación' },
  { id: 'library', label: 'Biblioteca' },
  { id: 'settings', label: 'Ajustes' },
];

type HomeData = {
  flights: Record<string, unknown>[];
  aircraft: Record<string, unknown>[];
  submittedExpenses: number;
  openReports: number | null;
  dueInspections: number;
};

type Props = {
  token: string;
  user: SessionUser;
  modules: string[];
  tenant: { slug: string; name: string; database?: string };
  branding: Branding | null;
  hostname: string | null;
  onLogout: () => void;
};

export function Workspace({ token, user, modules, tenant, branding, hostname, onLogout }: Props) {
  const visible = NAV.filter((item) => modules.includes(item.id));
  const [view, setView] = useState<ModuleId>('home');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [extra, setExtra] = useState<Record<string, unknown>[]>([]);
  const [more, setMore] = useState<Record<string, unknown>[]>([]);
  const [log, setLog] = useState<Record<string, unknown>[]>([]);
  const [home, setHome] = useState<HomeData | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const canReadSms = user.profile === 'admin' || user.profile === 'jefe_sms';

  useEffect(() => {
    if (visible.some((item) => item.id === view)) return;
    setView(visible[0]?.id ?? 'home');
  }, [modules, view, visible]);

  useEffect(() => {
    let stop = false;
    setError('');
    setNotice('');
    setDetail(null);
    setLoading(true);

    async function load() {
      try {
        if (view === 'home') {
          const data = await api<HomeData>('/home', token);
          if (stop) return;
          setHome(data);
          return;
        }
        setHome(null);
        if (view === 'operations') {
          const [services, expenses] = await Promise.all([
            api<Record<string, unknown>[]>('/operations/services', token),
            api<Record<string, unknown>[]>('/operations/expenses', token),
          ]);
          if (stop) return;
          setRows(services);
          setExtra(expenses);
          return;
        }
        if (view === 'maintenance') {
          const [inspections, discrepancies, orders, reviews] = await Promise.all([
            api<Record<string, unknown>[]>('/maintenance/inspections', token),
            api<Record<string, unknown>[]>('/maintenance/discrepancies', token),
            api<Record<string, unknown>[]>('/maintenance/work-orders', token),
            api<Record<string, unknown>[]>('/maintenance/log-review', token),
          ]);
          if (stop) return;
          setRows(inspections);
          setExtra(discrepancies);
          setMore(orders);
          setLog(reviews);
          return;
        }
        const path =
          view === 'sms'
            ? '/sms/reports'
            : view === 'communication'
              ? '/communication/meetings'
              : view === 'library'
                ? '/library/documents'
                : view === 'settings'
                  ? '/settings/users'
                  : `/${view}`;
        const data = await api<Record<string, unknown>[]>(path, token);
        if (stop) return;
        setRows(data);
        setExtra([]);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : 'No se pudo cargar');
      } finally {
        if (!stop) setLoading(false);
      }
    }
    void load();
    return () => {
      stop = true;
    };
  }, [view, token]);

  async function openDetail(id: string) {
    const path = view === 'crew' ? `/crew/${id}` : view === 'aircraft' ? `/aircraft/${id}` : `/flights/${id}`;
    setDetail(await api<Record<string, unknown>>(path, token));
  }

  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setNotice('');
    setError('');
    try {
      await api('/sms/reports', token, {
        method: 'POST',
        body: JSON.stringify({
          title: String(data.get('title') ?? ''),
          narrative: String(data.get('narrative') ?? ''),
          anonymous: data.get('anonymous') === 'on',
          severity: 'medium',
        }),
      });
      event.currentTarget.reset();
      setNotice('Reporte enviado. El expediente queda reservado.');
      if (canReadSms) setRows(await api('/sms/reports', token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar');
    }
  }

  const title = visible.find((item) => item.id === view)?.label ?? 'Inicio';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-row">
          <span className="mark" aria-hidden="true">
            {branding?.logoMark ?? 'HC'}
          </span>
          <div>
            <p className="eyebrow">{branding?.displayName ?? tenant.name}</p>
            <p className="tagline">{branding?.tagline}</p>
          </div>
        </div>
        <div className="userbox">
          <span>
            {user.name}
            {user.profile ? ` · ${user.profile}` : ''}
          </span>
          <button type="button" className="ghost" onClick={onLogout}>
            Salir
          </button>
        </div>
      </header>
      <div className="body">
        <nav className="sidenav" aria-label="Módulos">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === view ? 'nav on' : 'nav'}
              aria-current={item.id === view ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main className="content">
          <p className="meta">
            {hostname} · base {tenant.database ?? tenant.slug}
          </p>
          <h1>{title}</h1>
          {modules.length === 0 ? <p className="status">Vuelve a iniciar sesión para cargar tu perfil.</p> : null}
          {loading ? <p className="status">Cargando…</p> : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {view === 'home' && home ? <Home data={home} showReports={canReadSms} /> : null}
          {view === 'crew' ? (
            <People rows={rows} columns={['full_name', 'position', 'base', 'license_expires']} onOpen={openDetail} />
          ) : null}
          {view === 'aircraft' ? (
            <People
              rows={rows}
              columns={['registration', 'model', 'technical_status', 'airframe_hours', 'airframe_cycles']}
              onOpen={openDetail}
            />
          ) : null}
          {view === 'flights' ? (
            <People
              rows={rows}
              columns={['code', 'registration', 'origin', 'destination', 'status', 'fpl_status', 'review_status']}
              onOpen={openDetail}
            />
          ) : null}
          {view === 'operations' ? (
            <>
              <h2>Servicios</h2>
              <Table rows={rows} columns={['flight_code', 'kind', 'provider', 'status', 'amount', 'currency']} />
              <h2>Gastos</h2>
              <Table rows={extra} columns={['flight_code', 'category', 'description', 'amount', 'currency', 'status']} />
            </>
          ) : null}
          {view === 'maintenance' ? (
            <>
              <h2>Inspecciones</h2>
              <Table rows={rows} columns={['registration', 'title', 'due_date', 'due_hours', 'status']} />
              <h2>Discrepancias</h2>
              <Table rows={extra} columns={['registration', 'title', 'status', 'reported_by']} />
              <h2>Órdenes</h2>
              <Table rows={more} columns={['registration', 'title', 'assigned_to', 'status']} />
              <h2>Revisión de LOG</h2>
              <Table rows={log} columns={['code', 'registration', 'pilot_name', 'flight_minutes', 'cycles', 'review_status']} />
            </>
          ) : null}
          {view === 'sms' ? (
            <>
              <form className="stack" onSubmit={sendReport}>
                <label htmlFor="sms-title">Título</label>
                <input id="sms-title" name="title" required />
                <label htmlFor="sms-body">Relato</label>
                <textarea id="sms-body" name="narrative" required rows={4} />
                <label className="check">
                  <input name="anonymous" type="checkbox" /> Enviar sin nombre
                </label>
                <button type="submit">Enviar reporte</button>
              </form>
              {notice ? <p role="status">{notice}</p> : null}
              {canReadSms ? (
                <Table rows={rows} columns={['title', 'severity', 'status', 'anonymous', 'reporter_email']} />
              ) : (
                <p>El expediente original lo consultan el administrador y el jefe de SMS.</p>
              )}
            </>
          ) : null}
          {view === 'communication' ? <Table rows={rows} columns={['title', 'agenda', 'status']} /> : null}
          {view === 'library' ? <Table rows={rows} columns={['code', 'title', 'category', 'edition', 'status']} /> : null}
          {view === 'settings' ? <Table rows={rows} columns={['name', 'email', 'profile_name', 'active']} /> : null}
          {detail ? <Detail data={detail} /> : null}
        </main>
      </div>
    </div>
  );
}

function Home({ data, showReports }: { data: HomeData; showReports: boolean }) {
  return (
    <>
      <div className="stats">
        <article>
          <p>Gastos enviados</p>
          <strong>{data.submittedExpenses}</strong>
        </article>
        <article>
          <p>Inspecciones vencidas</p>
          <strong>{data.dueInspections}</strong>
        </article>
        {showReports && data.openReports != null ? (
          <article>
            <p>Reportes SMS abiertos</p>
            <strong>{data.openReports}</strong>
          </article>
        ) : null}
      </div>
      <h2>Vuelos</h2>
      <Table rows={data.flights} columns={['code', 'flight_date', 'origin', 'destination', 'status']} />
      <h2>Aeronaves</h2>
      <Table rows={data.aircraft} columns={['registration', 'model', 'technical_status']} />
    </>
  );
}

function People({
  rows,
  columns,
  onOpen,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
  onOpen: (id: string) => void;
}) {
  if (!rows.length) return <p className="status">Sin registros.</p>;
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{label(column)}</th>
          ))}
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row.id)}>
            {columns.map((column) => (
              <td key={column}>{text(row[column])}</td>
            ))}
            <td>
              <button type="button" className="ghost" onClick={() => onOpen(String(row.id))}>
                Abrir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Table({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  if (!rows.length) return <p className="status">Sin registros.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{label(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => (
                <td key={column}>{text(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="panel detail">
      <h2>Detalle</h2>
      {Object.entries(data).map(([key, value]) =>
        Array.isArray(value) ? (
          <div key={key}>
            <h3>{label(key)}</h3>
            <Table rows={value as Record<string, unknown>[]} columns={columnsOf(value)} />
          </div>
        ) : value && typeof value === 'object' ? (
          <dl key={key}>
            {Object.entries(value as Record<string, unknown>).map(([field, fieldValue]) => (
              <div key={field}>
                <dt>{label(field)}</dt>
                <dd>{text(fieldValue)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p key={key}>
            {label(key)}: {text(value)}
          </p>
        ),
      )}
    </section>
  );
}

function columnsOf(rows: unknown[]) {
  const first = rows[0];
  if (!first || typeof first !== 'object') return [];
  return Object.keys(first as Record<string, unknown>).filter((key) => key !== 'id');
}

function text(value: unknown) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function label(column: string) {
  const names: Record<string, string> = {
    full_name: 'Nombre',
    position: 'Cargo',
    base: 'Base',
    license_expires: 'Licencia',
    registration: 'Matrícula',
    model: 'Modelo',
    technical_status: 'Estado técnico',
    airframe_hours: 'Horas',
    airframe_cycles: 'Ciclos',
    code: 'Vuelo',
    origin: 'Origen',
    destination: 'Destino',
    status: 'Estado',
    fpl_status: 'FPL',
    review_status: 'LOG',
    flight_code: 'Vuelo',
    flight_date: 'Fecha',
    kind: 'Servicio',
    provider: 'Proveedor',
    amount: 'Importe',
    currency: 'Moneda',
    category: 'Categoría',
    description: 'Descripción',
    title: 'Título',
    due_date: 'Vence',
    due_hours: 'Horas límite',
    assigned_to: 'Asignado',
    severity: 'Severidad',
    anonymous: 'Anónimo',
    reporter_email: 'Autor',
    agenda: 'Agenda',
    edition: 'Edición',
    email: 'Correo',
    profile_name: 'Perfil',
    name: 'Nombre',
    active: 'Activo',
    reported_by: 'Reportó',
    pilot_name: 'Piloto',
    flight_minutes: 'Minutos',
    cycles: 'Ciclos',
    worker: 'Persona',
    assignments: 'Asignaciones',
    experience: 'Experiencia',
    aircraft: 'Aeronave',
    documents: 'Documentos',
    history: 'Historial',
    flight: 'Vuelo',
    plan: 'Plan',
    log: 'Bitácora',
    hours: 'Horas',
    activity: 'Actividad',
    notes: 'Notas',
    route: 'Ruta',
    profile: 'Perfil',
  };
  return names[column] ?? column;
}

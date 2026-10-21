import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, fetchStoredFileBlob, Branding, SessionUser, uploadFile } from './api';
import { Locale, t } from './i18n/catalog';
import { HomeData, HomePage } from './HomePage';
import { AircraftDocumentForm, AircraftPage } from './modules/AircraftPage';
import { CommunicationPage } from './modules/CommunicationPage';
import { CrewPage, WorkerForm } from './modules/CrewPage';
import { FlightForm, FlightsPage } from './modules/FlightsPage';
import { LibraryPage } from './modules/LibraryPage';
import { MaintenancePage } from './modules/MaintenancePage';
import { OperationsPage } from './modules/OperationsPage';
import { SettingsPage } from './modules/SettingsPage';
import { SmsPage } from './modules/SmsPage';
import { NavIcon } from './navIcons';
import { FilePreviewModal } from './ui/FilePreviewModal';
import { useConfirm } from './ui/useConfirm';
import { DetailPanel } from './ui/table';

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

const MAIN_NAV: ModuleId[] = [
  'home',
  'crew',
  'aircraft',
  'flights',
  'operations',
  'maintenance',
  'sms',
  'communication',
  'library',
];

const emptyDocument = (): AircraftDocumentForm => ({
  title: '',
  status: 'current',
  expiresOn: '',
});

const emptyFlight = (): FlightForm => ({
  code: '',
  aircraftId: '',
  flightDate: '',
  origin: '',
  destination: '',
  eobt: '0800',
  status: 'planned',
});

const emptyWorker = (): WorkerForm => ({
  employeeCode: '',
  fullName: '',
  position: '',
  base: '',
  status: 'active',
  licenseNumber: '',
  licenseExpires: '',
  medicalExpires: '',
});

type Props = {
  token: string;
  user: SessionUser;
  modules: string[];
  tenant: { slug: string; name: string; database?: string };
  branding: Branding | null;
  hostname: string | null;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onLogout: () => void;
};

export function Workspace({
  token,
  user,
  modules,
  tenant,
  branding,
  hostname,
  locale,
  onLocaleChange,
  onLogout,
}: Props) {
  const copy = t(locale);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const visibleMain = MAIN_NAV.filter((id) => modules.includes(id));
  const canSettings = modules.includes('settings');
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyWorker);
  const [showForm, setShowForm] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<Record<string, unknown>[]>([]);
  const [companySettings, setCompanySettings] = useState<Record<string, unknown> | null>(null);
  const [settingsProfiles, setSettingsProfiles] = useState<Record<string, unknown>[]>([]);
  const [documentForm, setDocumentForm] = useState<AircraftDocumentForm>(emptyDocument);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<Record<string, unknown>[]>([]);
  const [flightForm, setFlightForm] = useState<FlightForm>(emptyFlight);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [aircraftOptions, setAircraftOptions] = useState<Record<string, unknown>[]>([]);
  const [filePreview, setFilePreview] = useState<{ id: string; name: string; mime: string } | null>(null);
  const canReadSms = user.profile === 'admin' || user.profile === 'jefe_sms';

  const clock = useMemo(() => formatClock(new Date(), locale), [locale, home]);

  useEffect(() => {
    const allowed = [...visibleMain, ...(canSettings ? (['settings'] as ModuleId[]) : [])];
    if (allowed.some((id) => id === view)) return;
    setView(allowed[0] ?? 'home');
  }, [modules, view, visibleMain, canSettings]);

  useEffect(() => {
    let stop = false;
    setError('');
    setNotice('');
    setDetail(null);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyWorker());
    setRows([]);
    setExtra([]);
    setMore([]);
    setLog([]);
    setScheduleRows([]);
    setFileRows([]);
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
        if (view === 'crew') {
          const [crew, assignments] = await Promise.all([
            api<Record<string, unknown>[]>('/crew', token),
            api<Record<string, unknown>[]>('/crew/assignments', token),
          ]);
          if (stop) return;
          setRows(crew);
          setScheduleRows(assignments);
          return;
        }
        if (view === 'settings') {
          const [users, company, profiles] = await Promise.all([
            api<Record<string, unknown>[]>('/settings/users', token),
            api<Record<string, unknown> | null>('/settings/company', token),
            api<Record<string, unknown>[]>('/settings/profiles', token),
          ]);
          if (stop) return;
          setRows(users);
          setCompanySettings(company);
          setSettingsProfiles(profiles);
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
                  : `/${view}`;
        const data = await api<Record<string, unknown>[]>(path, token);
        if (stop) return;
        setRows(data);
        setExtra([]);
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        if (!stop) setLoading(false);
      }
    }
    void load();
    return () => {
      stop = true;
    };
  }, [view, token]);

  async function reloadSettings() {
    const [users, company, profiles] = await Promise.all([
      api<Record<string, unknown>[]>('/settings/users', token),
      api<Record<string, unknown> | null>('/settings/company', token),
      api<Record<string, unknown>[]>('/settings/profiles', token),
    ]);
    setRows(users);
    setCompanySettings(company);
    setSettingsProfiles(profiles);
  }

  async function saveCompany(body: {
    displayName: string;
    tagline: string;
    primaryColor: string;
    accentColor: string;
  }): Promise<boolean> {
    setError('');
    setNotice('');
    try {
      const updated = await api<Record<string, unknown>>('/settings/company', token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setCompanySettings(updated);
      setNotice(copy.saved);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function saveUserProfile(email: string, profile: string): Promise<boolean> {
    setError('');
    setNotice('');
    try {
      await api(`/settings/users/${encodeURIComponent(email)}/profile`, token, {
        method: 'PATCH',
        body: JSON.stringify({ profile }),
      });
      setNotice(copy.saved);
      await reloadSettings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function submitAircraftDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail?.id) return;
    const docId = editingDocumentId;
    const body = {
      title: documentForm.title,
      status: documentForm.status,
      expiresOn: documentForm.expiresOn || null,
    };
    setError('');
    setNotice('');
    try {
      if (docId) {
        await api(`/aircraft/documents/${docId}`, token, { method: 'PUT', body: JSON.stringify(body) });
        setNotice(copy.saved);
      } else {
        await api(`/aircraft/${detail.id}/documents`, token, { method: 'POST', body: JSON.stringify(body) });
        setNotice(copy.created);
      }
      setShowDocumentForm(false);
      setEditingDocumentId(null);
      setDocumentForm(emptyDocument());
      await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function askSoftDelete(message: string) {
    return confirm({
      title: copy.confirmTitle,
      message,
      confirmLabel: copy.softDelete,
      cancelLabel: copy.cancel,
    });
  }

  async function deleteAircraftDocument(id: string) {
    if (!(await askSoftDelete(copy.confirmSoftDeleteDocument))) return;
    if (!detail?.id) return;
    setError('');
    try {
      await api(`/aircraft/documents/${id}`, token, { method: 'DELETE' });
      setNotice(copy.deleted);
      await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function startEditDocument(row: Record<string, unknown>) {
    setEditingDocumentId(String(row.id));
    setDocumentForm({
      title: String(row.title ?? ''),
      status: String(row.status ?? 'current'),
      expiresOn: String(row.expiry_date ?? '').slice(0, 10),
    });
    setShowDocumentForm(true);
  }

  async function reloadCrew() {
    const [crew, assignments] = await Promise.all([
      api<Record<string, unknown>[]>('/crew', token),
      api<Record<string, unknown>[]>('/crew/assignments', token),
    ]);
    setRows(crew);
    setScheduleRows(assignments);
  }

  async function reloadAircraftFiles(aircraftId: string) {
    setFileRows(
      await api<Record<string, unknown>[]>(`/files?module=aircraft&entityId=${encodeURIComponent(aircraftId)}`, token),
    );
  }

  async function openDetail(id: string) {
    if (!id) return;
    const path = view === 'crew' ? `/crew/${id}` : view === 'aircraft' ? `/aircraft/${id}` : `/flights/${id}`;
    try {
      const data = await api<Record<string, unknown>>(path, token);
      setDetail(data);
      if (view === 'aircraft') await reloadAircraftFiles(id);
    } catch (err) {
      setDetail(null);
      setFileRows([]);
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function uploadAircraftFile(file: File) {
    if (!detail?.id) return;
    setError('');
    setNotice('');
    const form = new FormData();
    form.append('module', 'aircraft');
    form.append('entityId', String(detail.id));
    form.append('file', file);
    try {
      await uploadFile('/files', token, form);
      setNotice(copy.created);
      await reloadAircraftFiles(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function downloadStoredFile(id: string, name: string) {
    setError('');
    try {
      const { url } = await fetchStoredFileBlob(id, token);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function openFilePreview(id: string, name: string, mime: string) {
    setFilePreview({ id, name, mime });
  }

  async function deleteStoredFile(id: string) {
    if (!(await askSoftDelete(copy.confirmSoftDeleteDocument))) return;
    if (!detail?.id) return;
    setError('');
    try {
      await api(`/files/${id}`, token, { method: 'DELETE' });
      setNotice(copy.deleted);
      await reloadAircraftFiles(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function startCreateFlight() {
    setError('');
    try {
      const aircraft = await api<Record<string, unknown>[]>('/aircraft', token);
      setAircraftOptions(aircraft);
      setFlightForm(emptyFlight());
      setShowFlightForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function submitFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await api('/flights', token, {
        method: 'POST',
        body: JSON.stringify(flightForm),
      });
      setShowFlightForm(false);
      setFlightForm(emptyFlight());
      setNotice(copy.created);
      setRows(await api<Record<string, unknown>[]>('/flights', token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function sendReport(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    const formEl = event.currentTarget;
    const data = new FormData(formEl);
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
      formEl.reset();
      setNotice(copy.sms.sent);
      if (canReadSms) setRows(await api('/sms/reports', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function submitCrew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const body = {
      employeeCode: form.employeeCode,
      fullName: form.fullName,
      position: form.position,
      base: form.base,
      status: form.status,
      licenseNumber: form.licenseNumber || null,
      licenseExpires: form.licenseExpires || null,
      medicalExpires: form.medicalExpires || null,
    };
    const workerId = editingId;
    try {
      if (workerId) {
        await api(`/crew/${workerId}`, token, { method: 'PUT', body: JSON.stringify(body) });
        setNotice(copy.saved);
      } else {
        await api('/crew', token, { method: 'POST', body: JSON.stringify(body) });
        setNotice(copy.created);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyWorker());
      await reloadCrew();
      if (workerId) await openDetail(workerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    if (!detail?.id) return false;
    const formEl = event.currentTarget;
    const data = new FormData(formEl);
    setError('');
    setNotice('');
    try {
      const starts = String(data.get('startsAt') ?? '');
      const ends = String(data.get('endsAt') ?? '');
      await api(`/crew/${detail.id}/assignments`, token, {
        method: 'POST',
        body: JSON.stringify({
          activity: String(data.get('activity') ?? ''),
          startsAt: starts ? new Date(starts).toISOString() : '',
          endsAt: ends ? new Date(ends).toISOString() : '',
          notes: String(data.get('notes') ?? ''),
        }),
      });
      formEl.reset();
      setNotice(copy.created);
      await openDetail(String(detail.id));
      setScheduleRows(await api('/crew/assignments', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function deleteAssignment(assignmentId: string) {
    if (!(await askSoftDelete(copy.confirmSoftDeleteAssignment))) return;
    setError('');
    try {
      await api(`/crew/assignments/${assignmentId}`, token, { method: 'DELETE' });
      setNotice(copy.deleted);
      if (detail?.id) await openDetail(String(detail.id));
      setScheduleRows(await api('/crew/assignments', token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function softDeleteCrew(id: string) {
    if (!(await askSoftDelete(copy.confirmSoftDeleteWorker))) return;
    setError('');
    try {
      await api(`/crew/${id}`, token, { method: 'DELETE' });
      setNotice(copy.deleted);
      setDetail(null);
      await reloadCrew();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function startEdit(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setForm({
      employeeCode: String(row.employee_code ?? ''),
      fullName: String(row.full_name ?? ''),
      position: String(row.position ?? ''),
      base: String(row.base ?? ''),
      status: String(row.status ?? 'active'),
      licenseNumber: String(row.license_number ?? ''),
      licenseExpires: String(row.license_expires ?? '').slice(0, 10),
      medicalExpires: String(row.medical_expires ?? '').slice(0, 10),
    });
    setShowForm(true);
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const listRows = view === 'sms' && !canReadSms ? [] : rows;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="logo logo-sm" src="/logo-havectrl.png" alt="" />
          <div>
            <p className="brand-name">HAVECTRL</p>
            <p className="brand-sub">Aviation Operations Platform</p>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Modules">
          {visibleMain.map((id) => (
            <button
              key={id}
              type="button"
              className={id === view ? 'side-link on' : 'side-link'}
              aria-current={id === view ? 'page' : undefined}
              onClick={() => setView(id)}
            >
              <NavIcon id={id} />
              <span>{copy.modules[id]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          {canSettings ? (
            <button
              type="button"
              className={view === 'settings' ? 'side-link on' : 'side-link'}
              onClick={() => setView('settings')}
            >
              <NavIcon id="settings" />
              <span>{copy.modules.settings}</span>
            </button>
          ) : null}
          <div className="side-user">
            <span className="avatar">{initials || 'HC'}</span>
            <div>
              <strong>{user.name}</strong>
              <p>{user.profile || tenant.name}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-pane">
        <header className="main-top">
          <div className="main-top-title">
            <strong>{view in copy.modules ? copy.modules[view as keyof typeof copy.modules] : copy.appName}</strong>
          </div>
          <div className="main-tools">
            <time dateTime={new Date().toISOString()}>{clock}</time>
            <select
              value={locale}
              aria-label={copy.language}
              onChange={(event) => {
                const next = event.target.value;
                if (next === 'en' || next === 'es') onLocaleChange(next);
              }}
            >
              <option value="en">{copy.english}</option>
              <option value="es">{copy.spanish}</option>
            </select>
            <button type="button" className="ghost" onClick={onLogout}>
              {copy.logout}
            </button>
          </div>
        </header>

        <main className={`main-content ${view === 'home' ? 'is-home' : 'is-module'}`}>
          {view !== 'home' && view !== 'crew' && view !== 'settings' ? (
            <p className="meta">
              {hostname} · {tenant.database ?? tenant.slug}
            </p>
          ) : null}
          {modules.length === 0 ? <p className="status">{copy.reloadSession}</p> : null}
          {loading ? <p className="status">{copy.loading}</p> : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p role="status">{notice}</p> : null}

          {view === 'home' && home ? (
            <HomePage
              data={home}
              locale={locale}
              brandingName={branding?.displayName}
              onOpenModule={(id) => setView(id)}
            />
          ) : null}

          {view === 'crew' ? (
            <CrewPage
              locale={locale}
              rows={listRows}
              scheduleRows={scheduleRows}
              detail={detail}
              form={form}
              showForm={showForm}
              editingId={editingId}
              onSelect={openDetail}
              onFormChange={setForm}
              onShowForm={setShowForm}
              onStartCreate={() => {
                setEditingId(null);
                setForm(emptyWorker());
                setShowForm(true);
              }}
              onStartEdit={startEdit}
              onSubmit={submitCrew}
              onDelete={softDeleteCrew}
              onCreateAssignment={submitAssignment}
              onDeleteAssignment={deleteAssignment}
            />
          ) : null}

          {view === 'aircraft' ? (
            <AircraftPage
              locale={locale}
              rows={listRows}
              detail={detail}
              documentForm={documentForm}
              showDocumentForm={showDocumentForm}
              editingDocumentId={editingDocumentId}
              onSelect={openDetail}
              onDocumentFormChange={setDocumentForm}
              onShowDocumentForm={setShowDocumentForm}
              onStartCreateDocument={() => {
                setEditingDocumentId(null);
                setDocumentForm(emptyDocument());
                setShowDocumentForm(true);
              }}
              onStartEditDocument={startEditDocument}
              onSubmitDocument={submitAircraftDocument}
              onDeleteDocument={deleteAircraftDocument}
              fileRows={fileRows}
              onUploadFile={uploadAircraftFile}
              onDownloadFile={downloadStoredFile}
              onPreviewFile={openFilePreview}
              onDeleteFile={deleteStoredFile}
            />
          ) : null}

          {view === 'flights' ? (
            <FlightsPage
              locale={locale}
              rows={listRows}
              detail={detail}
              aircraftOptions={aircraftOptions}
              flightForm={flightForm}
              showFlightForm={showFlightForm}
              onOpen={openDetail}
              onCloseDetail={() => setDetail(null)}
              onStartCreateFlight={startCreateFlight}
              onFlightFormChange={setFlightForm}
              onShowFlightForm={setShowFlightForm}
              onSubmitFlight={submitFlight}
            />
          ) : null}

          {view === 'operations' ? (
            <OperationsPage locale={locale} services={listRows} expenses={extra} />
          ) : null}

          {view === 'maintenance' ? (
            <MaintenancePage
              locale={locale}
              inspections={listRows}
              discrepancies={extra}
              orders={more}
              logReviews={log}
            />
          ) : null}

          {view === 'sms' ? (
            <SmsPage locale={locale} rows={listRows} canRead={canReadSms} onSubmit={sendReport} />
          ) : null}

          {view === 'communication' ? <CommunicationPage locale={locale} rows={listRows} /> : null}

          {view === 'library' ? <LibraryPage locale={locale} rows={listRows} /> : null}

          {view === 'settings' ? (
            <SettingsPage
              locale={locale}
              users={listRows}
              profiles={settingsProfiles}
              branding={branding}
              company={companySettings}
              tenantName={tenant.name}
              onSaveCompany={saveCompany}
              onSaveUserProfile={saveUserProfile}
            />
          ) : null}

          {detail && view !== 'crew' && view !== 'aircraft' && view !== 'flights' ? (
            <DetailPanel data={detail} locale={locale} />
          ) : null}
        </main>
      </div>
      {confirmDialog}
      <FilePreviewModal
        locale={locale}
        open={filePreview != null}
        token={token}
        fileId={filePreview?.id ?? null}
        fileName={filePreview?.name ?? ''}
        mimeType={filePreview?.mime ?? ''}
        onClose={() => setFilePreview(null)}
        onDownload={() => {
          if (filePreview) void downloadStoredFile(filePreview.id, filePreview.name);
        }}
      />
    </div>
  );
}

function formatClock(date: Date, locale: Locale) {
  const fmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-VE' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  return fmt.format(date);
}

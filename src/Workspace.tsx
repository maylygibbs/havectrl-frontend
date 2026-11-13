import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api, downloadAuthorized, fetchStoredFileBlob, Branding, SessionUser, uploadFile } from './api';
import { Locale, t } from './i18n/catalog';
import { HomeData, HomePage } from './HomePage';
import { AircraftDocumentForm, AircraftForm, AircraftPage } from './modules/AircraftPage';
import { CommunicationPage } from './modules/CommunicationPage';
import { type AssignmentSave, CrewDocumentForm, CrewPage, type WorkerFocus, WorkerForm } from './modules/CrewPage';
import { dayKeyLocal, shiftAssignmentToDay } from './modules/crew/crew-schedule-roster';
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
  status: 'valid',
  expiresOn: '',
});

const emptyAircraft = (): AircraftForm => ({
  registration: '',
  model: '',
  serialNumber: '',
  base: '',
  technicalStatus: 'unknown',
  airframeHours: '',
  airframeCycles: '',
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

const emptyCrewDocument = (category = 'other'): CrewDocumentForm => ({
  category,
  title: '',
  documentNumber: '',
  issuer: '',
  expiresOn: '',
  effectiveOn: '',
  privateNote: '',
  status: 'current',
});

const emptyWorker = (): WorkerForm => ({
  employeeCode: '',
  fullName: '',
  position: '',
  base: '',
  team: 'operations',
  email: '',
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
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyWorker);
  const [showForm, setShowForm] = useState(false);
  const [workerFocus, setWorkerFocus] = useState<WorkerFocus>('identity');
  const [scheduleRows, setScheduleRows] = useState<Record<string, unknown>[]>([]);
  const [assignableFlights, setAssignableFlights] = useState<
    { code: string; origin: string; destination: string; registration: string }[]
  >([]);
  const [companySettings, setCompanySettings] = useState<Record<string, unknown> | null>(null);
  const [settingsProfiles, setSettingsProfiles] = useState<Record<string, unknown>[]>([]);
  const [documentForm, setDocumentForm] = useState<AircraftDocumentForm>(emptyDocument);
  const [aircraftForm, setAircraftForm] = useState<AircraftForm>(emptyAircraft);
  const [showAircraftForm, setShowAircraftForm] = useState(false);
  const [editingAircraftId, setEditingAircraftId] = useState<string | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<Record<string, unknown>[]>([]);
  const [crewDocumentForm, setCrewDocumentForm] = useState<CrewDocumentForm>(emptyCrewDocument());
  const [showCrewDocumentForm, setShowCrewDocumentForm] = useState(false);
  const [editingCrewDocumentId, setEditingCrewDocumentId] = useState<string | null>(null);
  const [flightForm, setFlightForm] = useState<FlightForm>(emptyFlight);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [aircraftOptions, setAircraftOptions] = useState<Record<string, unknown>[]>([]);
  const [crewOptions, setCrewOptions] = useState<{ id: string; full_name: string }[]>([]);
  const [filePreview, setFilePreview] = useState<{ id: string; name: string; mime: string } | null>(null);
  const canReadSms = user.profile === 'admin' || user.profile === 'jefe_sms';

  const clock = useMemo(() => formatClock(new Date(), locale), [locale, home]);

  useEffect(() => {
    const allowed = [...visibleMain, ...(canSettings ? (['settings'] as ModuleId[]) : [])];
    if (allowed.some((id) => id === view)) return;
    setView(allowed[0] ?? 'home');
  }, [modules, view, visibleMain, canSettings]);

  useEffect(() => {
    if (!accountOpen) return;
    function closeOnOutside(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);

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
          const [services, expenses, payments, flights] = await Promise.all([
            api<Record<string, unknown>[]>('/operations/services', token),
            api<Record<string, unknown>[]>('/operations/expenses', token),
            api<Record<string, unknown>[]>('/operations/payments', token),
            api<Record<string, unknown>[]>('/flights', token),
          ]);
          if (stop) return;
          setRows(services);
          setExtra(expenses);
          setMore(payments);
          setLog(flights);
          return;
        }
        if (view === 'crew') {
          const [crew, assignments, flights] = await Promise.all([
            api<Record<string, unknown>[]>('/crew', token),
            api<Record<string, unknown>[]>('/crew/assignments', token),
            api<{ code: string; origin: string; destination: string; registration: string }[]>(
              '/crew/assignable-flights',
              token,
            ),
          ]);
          if (stop) return;
          setRows(crew);
          setScheduleRows(assignments);
          setAssignableFlights(flights);
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
          const [inspections, discrepancies, orders, reviews, fleet] = await Promise.all([
            api<Record<string, unknown>[]>('/maintenance/inspections', token),
            api<Record<string, unknown>[]>('/maintenance/discrepancies', token),
            api<Record<string, unknown>[]>('/maintenance/work-orders', token),
            api<Record<string, unknown>[]>('/maintenance/log-review', token),
            api<Record<string, unknown>[]>('/aircraft', token),
          ]);
          if (stop) return;
          setRows(inspections);
          setExtra(discrepancies);
          setMore(orders);
          setLog(reviews);
          setAircraftOptions(fleet);
          return;
        }
        if (view === 'library') {
          const [docs, marks] = await Promise.all([
            api<Record<string, unknown>[]>('/library/documents', token),
            api<Record<string, unknown>[]>('/library/bookmarks', token),
          ]);
          if (stop) return;
          setRows(docs);
          setExtra(marks);
          setFileRows([]);
          return;
        }
        const path =
          view === 'sms'
            ? '/sms/reports'
            : view === 'communication'
              ? '/communication/meetings'
              : `/${view}`;
        const data = await api<Record<string, unknown>[]>(path, token);
        if (stop) return;
        setRows(data);
        setExtra([]);
        if (view === 'flights') {
          try {
            const crew = await api<{ id: string; full_name: string }[]>('/crew', token);
            if (!stop) setCrewOptions(crew);
          } catch {
            if (!stop) setCrewOptions([]);
          }
        }
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

  function startEditAircraft(row: Record<string, unknown>) {
    setEditingAircraftId(String(row.id));
    setAircraftForm({
      registration: String(row.registration ?? ''),
      model: String(row.model ?? ''),
      serialNumber: String(row.serial_number ?? ''),
      base: String(row.base ?? ''),
      technicalStatus: String(row.technical_status ?? 'unknown'),
      airframeHours: row.airframe_hours == null ? '' : String(row.airframe_hours),
      airframeCycles: row.airframe_cycles == null ? '' : String(row.airframe_cycles),
    });
    setShowAircraftForm(true);
  }

  async function submitAircraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hours = aircraftForm.airframeHours.trim();
    const cycles = aircraftForm.airframeCycles.trim();
    const body = {
      registration: aircraftForm.registration,
      model: aircraftForm.model,
      serialNumber: aircraftForm.serialNumber,
      base: aircraftForm.base,
      technicalStatus: aircraftForm.technicalStatus,
      airframeHours: hours === '' ? null : Number(hours),
      airframeCycles: cycles === '' ? null : Number(cycles),
    };
    setError('');
    setNotice('');
    try {
      const saved = editingAircraftId
        ? await api<{ id: string }>(`/aircraft/${editingAircraftId}`, token, { method: 'PUT', body: JSON.stringify(body) })
        : await api<{ id: string }>('/aircraft', token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(editingAircraftId ? copy.saved : copy.created);
      setShowAircraftForm(false);
      setEditingAircraftId(null);
      setAircraftForm(emptyAircraft());
      setRows(await api<Record<string, unknown>[]>('/aircraft', token));
      if (saved?.id) await openDetail(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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

  async function submitCrewDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail?.id) return;
    const docId = editingCrewDocumentId;
    const body = {
      category: crewDocumentForm.category,
      title: crewDocumentForm.title,
      documentNumber: crewDocumentForm.documentNumber || null,
      issuer: crewDocumentForm.issuer || null,
      expiresOn: crewDocumentForm.expiresOn || null,
      effectiveOn: crewDocumentForm.effectiveOn || null,
      privateNote: crewDocumentForm.privateNote || null,
      status: crewDocumentForm.status,
    };
    setError('');
    setNotice('');
    try {
      if (docId) {
        await api(`/crew/documents/${docId}`, token, { method: 'PUT', body: JSON.stringify(body) });
        setNotice(copy.saved);
      } else {
        await api(`/crew/${detail.id}/documents`, token, { method: 'POST', body: JSON.stringify(body) });
        setNotice(copy.created);
      }
      setShowCrewDocumentForm(false);
      setEditingCrewDocumentId(null);
      setCrewDocumentForm(emptyCrewDocument());
      await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function deleteCrewDocument(id: string) {
    if (!(await askSoftDelete(copy.confirmSoftDeleteDocument))) return;
    if (!detail?.id) return;
    setError('');
    try {
      await api(`/crew/documents/${id}`, token, { method: 'DELETE' });
      setNotice(copy.deleted);
      await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function startCreateCrewDocument(category: string) {
    setEditingCrewDocumentId(null);
    setCrewDocumentForm(emptyCrewDocument(category));
    setShowCrewDocumentForm(true);
  }

  function startEditCrewDocument(row: Record<string, unknown>) {
    setEditingCrewDocumentId(String(row.id));
    setCrewDocumentForm({
      category: String(row.category ?? 'other'),
      title: String(row.title ?? ''),
      documentNumber: String(row.document_number ?? ''),
      issuer: String(row.issuer ?? ''),
      expiresOn: String(row.expires_on ?? '').slice(0, 10),
      effectiveOn: String(row.effective_on ?? '').slice(0, 10),
      privateNote: String(row.private_note ?? ''),
      status: String(row.status ?? 'current'),
    });
    setShowCrewDocumentForm(true);
  }

  async function reloadCrew() {
    const [crew, assignments, flights] = await Promise.all([
      api<Record<string, unknown>[]>('/crew', token),
      api<Record<string, unknown>[]>('/crew/assignments', token),
      api<{ code: string; origin: string; destination: string; registration: string }[]>(
        '/crew/assignable-flights',
        token,
      ),
    ]);
    setRows(crew);
    setScheduleRows(assignments);
    setAssignableFlights(flights);
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
      else if (view === 'crew') setFileRows(Array.isArray(data.files) ? (data.files as Record<string, unknown>[]) : []);
    } catch (err) {
      setDetail(null);
      setFileRows([]);
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function uploadModuleFile(module: 'aircraft' | 'crew', file: File) {
    if (!detail?.id) return;
    setError('');
    setNotice('');
    const form = new FormData();
    form.append('module', module);
    form.append('entityId', String(detail.id));
    form.append('file', file);
    try {
      await uploadFile('/files', token, form);
      setNotice(copy.created);
      if (module === 'aircraft') await reloadAircraftFiles(String(detail.id));
      else await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function uploadAircraftFile(file: File) {
    return uploadModuleFile('aircraft', file);
  }

  async function uploadCrewFile(file: File) {
    return uploadModuleFile('crew', file);
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
      if (view === 'aircraft') await reloadAircraftFiles(String(detail.id));
      else if (view === 'crew') await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function reloadOperations() {
    const [services, expenses, payments, flights] = await Promise.all([
      api<Record<string, unknown>[]>('/operations/services', token),
      api<Record<string, unknown>[]>('/operations/expenses', token),
      api<Record<string, unknown>[]>('/operations/payments', token),
      api<Record<string, unknown>[]>('/flights', token),
    ]);
    setRows(services);
    setExtra(expenses);
    setMore(payments);
    setLog(flights);
  }

  async function saveOperation(path: string, body: Record<string, unknown>) {
    setError('');
    setNotice('');
    try {
      await api(path, token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(copy.created);
      await reloadOperations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function approveExpense(id: string) {
    setError('');
    setNotice('');
    try {
      await api(`/operations/expenses/${id}/status`, token, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      });
      setNotice(copy.saved);
      await reloadOperations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function reloadMaintenance() {
    const [inspections, discrepancies, orders, reviews, fleet] = await Promise.all([
      api<Record<string, unknown>[]>('/maintenance/inspections', token),
      api<Record<string, unknown>[]>('/maintenance/discrepancies', token),
      api<Record<string, unknown>[]>('/maintenance/work-orders', token),
      api<Record<string, unknown>[]>('/maintenance/log-review', token),
      api<Record<string, unknown>[]>('/aircraft', token),
    ]);
    setRows(inspections);
    setExtra(discrepancies);
    setMore(orders);
    setLog(reviews);
    setAircraftOptions(fleet);
  }

  async function saveMaintenance(path: string, body: Record<string, unknown>) {
    setError('');
    setNotice('');
    try {
      await api(path, token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(copy.created);
      await reloadMaintenance();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
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

  async function addFlightLeg(
    flightId: string,
    body: { origin: string; destination: string; eet: string },
  ): Promise<boolean> {
    setError('');
    setNotice('');
    try {
      await api(`/flights/${flightId}/legs`, token, { method: 'POST', body: JSON.stringify(body) });
      await openDetail(flightId);
      setNotice(copy.created);
      setRows(await api<Record<string, unknown>[]>('/flights', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function deleteFlightLeg(legId: string): Promise<boolean> {
    const ok = await confirm({
      title: copy.confirmTitle,
      message: copy.confirmSoftDeleteAssignment,
      confirmLabel: copy.softDelete,
      cancelLabel: copy.cancel,
    });
    if (!ok) return false;
    setError('');
    setNotice('');
    try {
      await api(`/flights/legs/${legId}`, token, { method: 'DELETE' });
      if (detail?.id) await openDetail(String(detail.id));
      setNotice(copy.deleted);
      setRows(await api<Record<string, unknown>[]>('/flights', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function saveFlightLog(
    flightId: string,
    form: {
      blockMinutes: string;
      flightMinutes: string;
      cycles: string;
      pilotName: string;
      reviewStatus: string;
      notes: string;
      crewWorkerId: string;
      functionCode: string;
    },
  ): Promise<boolean> {
    setError('');
    setNotice('');
    try {
      await api(`/flights/${flightId}/log`, token, {
        method: 'PUT',
        body: JSON.stringify({
          blockMinutes: Number(form.blockMinutes),
          flightMinutes: Number(form.flightMinutes),
          cycles: Number(form.cycles),
          pilotName: form.pilotName,
          reviewStatus: form.reviewStatus,
          notes: form.notes,
          crew: form.crewWorkerId
            ? [{ workerId: form.crewWorkerId, functionCode: form.functionCode, countsAsFlight: form.functionCode !== 'PAX' }]
            : [],
        }),
      });
      await openDetail(flightId);
      setNotice(copy.saved);
      setRows(await api<Record<string, unknown>[]>('/flights', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function reloadLibrary() {
    const [docs, marks] = await Promise.all([
      api<Record<string, unknown>[]>('/library/documents', token),
      api<Record<string, unknown>[]>('/library/bookmarks', token),
    ]);
    setRows(docs);
    setExtra(marks);
  }

  async function createLibraryDocument(body: Record<string, unknown>, file: File | null) {
    setNotice('');
    setError('');
    try {
      const saved = await api<{ id: string }>('/library/documents', token, { method: 'POST', body: JSON.stringify(body) });
      if (file && saved?.id) {
        const form = new FormData();
        form.append('module', 'library');
        form.append('entityId', saved.id);
        form.append('file', file);
        await uploadFile('/files', token, form);
      }
      setNotice(copy.created);
      await reloadLibrary();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function createLibraryBookmark(body: Record<string, unknown>) {
    setNotice('');
    setError('');
    try {
      await api('/library/bookmarks', token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(copy.saved);
      await reloadLibrary();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function openLibraryDocument(id: string) {
    setError('');
    try {
      setFileRows(await api<Record<string, unknown>[]>(`/files?module=library&entityId=${encodeURIComponent(id)}`, token));
    } catch (err) {
      setFileRows([]);
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function openLibraryOriginal(fileId: string, name: string) {
    setError('');
    try {
      const { url } = await fetchStoredFileBlob(fileId, token);
      const opened = window.open(url, '_blank', 'noopener');
      if (!opened) await downloadAuthorized(`/files/${fileId}/download`, token, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function reloadMeetings() {
    setRows(await api<Record<string, unknown>[]>('/communication/meetings', token));
  }

  async function createMeeting(body: Record<string, unknown>) {
    setNotice('');
    setError('');
    try {
      await api('/communication/meetings', token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(copy.created);
      await reloadMeetings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function saveMinutes(id: string, body: Record<string, unknown>) {
    setNotice('');
    setError('');
    try {
      await api(`/communication/meetings/${id}/minutes`, token, { method: 'PUT', body: JSON.stringify(body) });
      setNotice(copy.saved);
      await reloadMeetings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function sendReport(body: { title: string; narrative: string; anonymous: boolean; severity: string }): Promise<boolean> {
    setNotice('');
    setError('');
    try {
      await api('/sms/reports', token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(copy.sms.sent);
      if (canReadSms) setRows(await api('/sms/reports', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function updateSmsStatus(id: string, status: string) {
    setNotice('');
    setError('');
    try {
      await api(`/sms/reports/${id}/status`, token, { method: 'PUT', body: JSON.stringify({ status }) });
      setNotice(copy.saved);
      setRows(await api('/sms/reports', token));
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
    const body =
      workerFocus === 'license'
        ? { licenseNumber: form.licenseNumber || null, licenseExpires: form.licenseExpires || null }
        : workerFocus === 'medical'
          ? { medicalExpires: form.medicalExpires || null }
          : {
              employeeCode: form.employeeCode,
              fullName: form.fullName,
              position: form.position,
              base: form.base,
              team: form.team,
              email: form.email || null,
              status: editingId ? form.status : 'active',
            };
    const workerId = editingId;
    try {
      const saved = workerId
        ? await api<{ id: string }>(`/crew/${workerId}`, token, { method: 'PUT', body: JSON.stringify(body) })
        : await api<{ id: string }>('/crew', token, { method: 'POST', body: JSON.stringify(body) });
      setNotice(workerId ? copy.saved : copy.created);
      setShowForm(false);
      setEditingId(null);
      setWorkerFocus('identity');
      setForm(emptyWorker());
      await reloadCrew();
      if (saved?.id) await openDetail(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function assignmentBody(payload: AssignmentSave) {
    const startMs = new Date(payload.startsAt).getTime();
    const endMs = new Date(payload.endsAt).getTime();
    return {
      ok: !Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs,
      body: {
        activity: payload.activity,
        startsAt: new Date(payload.startsAt).toISOString(),
        endsAt: new Date(payload.endsAt).toISOString(),
        notes: payload.notes,
        flightCode: payload.flightCode,
        origin: payload.origin,
        destination: payload.destination,
        aircraftRegistration: payload.aircraftRegistration,
      },
    };
  }

  async function submitAssignment(payload: AssignmentSave): Promise<boolean> {
    if (payload.workerIds.length === 0 || !payload.activity) {
      setError(copy.crew.assignmentNeedWorker);
      return false;
    }
    const packed = assignmentBody(payload);
    if (!packed.ok) {
      setError(copy.crew.assignmentEndAfterStart);
      return false;
    }
    setError('');
    setNotice('');
    try {
      for (const workerId of payload.workerIds) {
        await api(`/crew/${workerId}/assignments`, token, {
          method: 'POST',
          body: JSON.stringify(packed.body),
        });
      }
      setNotice(copy.created);
      setScheduleRows(await api('/crew/assignments', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function updateAssignment(id: string, payload: AssignmentSave): Promise<boolean> {
    const packed = assignmentBody(payload);
    if (!packed.ok || !payload.activity) {
      setError(copy.crew.assignmentEndAfterStart);
      return false;
    }
    setError('');
    setNotice('');
    try {
      await api(`/crew/assignments/${id}`, token, { method: 'PUT', body: JSON.stringify(packed.body) });
      setNotice(copy.saved);
      setScheduleRows(await api('/crew/assignments', token));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    }
  }

  async function moveAssignment(id: string, dayKey: string) {
    const row = scheduleRows.find((item) => String(item.id) === id);
    if (!row) return;
    const starts = String(row.starts_at ?? '');
    const ends = String(row.ends_at ?? '');
    if (dayKeyLocal(starts) === dayKey) return;
    const shifted = shiftAssignmentToDay(starts, ends, dayKey);
    if (!shifted) return;
    await updateAssignment(id, {
      workerIds: [String(row.worker_id ?? '')],
      activity: String(row.activity ?? ''),
      startsAt: shifted.startsAt,
      endsAt: shifted.endsAt,
      notes: String(row.notes ?? ''),
      flightCode: row.flight_code ? String(row.flight_code) : null,
      origin: row.origin ? String(row.origin) : null,
      destination: row.destination ? String(row.destination) : null,
      aircraftRegistration: row.aircraft_registration ? String(row.aircraft_registration) : null,
    });
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

  async function publishAssignment(assignmentId: string) {
    setError('');
    try {
      await api(`/crew/assignments/${assignmentId}/publish`, token, { method: 'POST' });
      setNotice(copy.saved);
      setScheduleRows(await api('/crew/assignments', token));
      if (detail?.id) await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function requestAssignmentChange(assignmentId: string, reason: string) {
    setError('');
    try {
      await api(`/crew/assignments/${assignmentId}/change-requests`, token, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setNotice(copy.saved);
      if (detail?.id) await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function reviewChangeRequest(requestId: string, decision: 'approve' | 'reject') {
    setError('');
    try {
      await api(`/crew/change-requests/${requestId}/review`, token, {
        method: 'POST',
        body: JSON.stringify({ decision: decision === 'approve' ? 'approve' : 'reject' }),
      });
      setNotice(copy.saved);
      if (detail?.id) await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function reviewCrewDocument(id: string, decision: 'accept' | 'reject') {
    setError('');
    try {
      await api(`/crew/documents/${id}/review`, token, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      setNotice(copy.saved);
      if (detail?.id) await openDetail(String(detail.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function exportCrewPdf(kind: 'profile' | 'schedule' | 'experience') {
    if (!detail?.id) return;
    setError('');
    try {
      await downloadAuthorized(`/crew/${String(detail.id)}/export/${kind}`, token, `crew-${kind}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  async function addPreviousExperience(origin: string, minutes: string, asOf: string) {
    if (!detail?.id) return;
    setError('');
    try {
      await api(`/crew/${String(detail.id)}/previous-experience`, token, {
        method: 'POST',
        body: JSON.stringify({ origin, flightMinutes: Number(minutes), asOf: asOf || undefined }),
      });
      setNotice(copy.saved);
      await openDetail(String(detail.id));
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

  function startEdit(row: Record<string, unknown>, focus: WorkerFocus = 'identity') {
    setWorkerFocus(focus);
    setEditingId(String(row.id));
    setForm({
      employeeCode: String(row.employee_code ?? ''),
      fullName: String(row.full_name ?? ''),
      position: String(row.position ?? ''),
      base: String(row.base ?? ''),
      team: String(row.team ?? 'operations'),
      email: String(row.email ?? ''),
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
          <img className="sidebar-logo" src="/brand/logo-transparent.png" alt="HAVECTRL" />
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
        {canSettings ? (
          <div className="sidebar-foot">
            <button
              type="button"
              className={view === 'settings' ? 'side-link on' : 'side-link'}
              onClick={() => setView('settings')}
            >
              <NavIcon id="settings" />
              <span>{copy.modules.settings}</span>
            </button>
          </div>
        ) : null}
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
            <div className="account-menu" ref={accountRef}>
              <button
                type="button"
                className="account-trigger"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={user.name}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="session-avatar" aria-hidden="true">
                  {initials || 'HC'}
                </span>
                <svg className="account-chevron" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              {accountOpen ? (
                <div className="account-panel" role="menu">
                  <p>{user.name}</p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      onLogout();
                    }}
                  >
                    {copy.logout}
                  </button>
                </div>
              ) : null}
            </div>
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
                setWorkerFocus('identity');
                setForm(emptyWorker());
                setShowForm(true);
              }}
              workerFocus={workerFocus}
              onStartEdit={startEdit}
              onSubmit={submitCrew}
              onDelete={softDeleteCrew}
              onCreateAssignment={submitAssignment}
              onUpdateAssignment={updateAssignment}
              onMoveAssignment={moveAssignment}
              assignableFlights={assignableFlights}
              onDeleteAssignment={deleteAssignment}
              onPublishAssignment={publishAssignment}
              onRequestChange={requestAssignmentChange}
              onReviewChange={reviewChangeRequest}
              onReviewDocument={reviewCrewDocument}
              onExportPdf={exportCrewPdf}
              onAddPrevious={addPreviousExperience}
              crewDocumentForm={crewDocumentForm}
              showCrewDocumentForm={showCrewDocumentForm}
              editingCrewDocumentId={editingCrewDocumentId}
              onCrewDocumentFormChange={setCrewDocumentForm}
              onShowCrewDocumentForm={setShowCrewDocumentForm}
              onStartCreateCrewDocument={startCreateCrewDocument}
              onStartEditCrewDocument={startEditCrewDocument}
              onSubmitCrewDocument={submitCrewDocument}
              onDeleteCrewDocument={deleteCrewDocument}
              fileRows={fileRows}
              onUploadFile={uploadCrewFile}
              onDownloadFile={downloadStoredFile}
              onPreviewFile={openFilePreview}
              onDeleteFile={deleteStoredFile}
            />
          ) : null}

          {view === 'aircraft' ? (
            <AircraftPage
              locale={locale}
              rows={listRows}
              detail={detail}
              aircraftForm={aircraftForm}
              showAircraftForm={showAircraftForm}
              editingAircraftId={editingAircraftId}
              onAircraftFormChange={setAircraftForm}
              onShowAircraftForm={setShowAircraftForm}
              onStartCreateAircraft={() => {
                setEditingAircraftId(null);
                setAircraftForm(emptyAircraft());
                setShowAircraftForm(true);
              }}
              onStartEditAircraft={startEditAircraft}
              onSubmitAircraft={submitAircraft}
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
              onAddLeg={addFlightLeg}
              onDeleteLeg={deleteFlightLeg}
              onSaveFlightLog={saveFlightLog}
              crewOptions={crewOptions}
            />
          ) : null}

          {view === 'operations' ? (
            <OperationsPage
              locale={locale}
              actorEmail={user.email}
              services={listRows}
              expenses={extra}
              payments={more}
              flights={log}
              onCreateService={(body) => saveOperation('/operations/services', body)}
              onCreateExpense={(body) => saveOperation('/operations/expenses', body)}
              onApproveExpense={approveExpense}
              onCreatePayment={(body) => saveOperation('/operations/payments', body)}
            />
          ) : null}

          {view === 'maintenance' ? (
            <MaintenancePage
              locale={locale}
              inspections={listRows}
              discrepancies={extra}
              orders={more}
              logReviews={log}
              aircraft={aircraftOptions}
              onCreateInspection={(body) => saveMaintenance('/maintenance/inspections', body)}
              onCreateDiscrepancy={(body) => saveMaintenance('/maintenance/discrepancies', body)}
              onCreateOrder={(body) => saveMaintenance('/maintenance/work-orders', body)}
            />
          ) : null}

          {view === 'sms' ? (
            <SmsPage locale={locale} rows={listRows} canRead={canReadSms} onSubmit={sendReport} onStatus={updateSmsStatus} />
          ) : null}

          {view === 'communication' ? (
            <CommunicationPage locale={locale} rows={listRows} onCreate={createMeeting} onMinutes={saveMinutes} />
          ) : null}

          {view === 'library' ? (
            <LibraryPage
              locale={locale}
              isAdmin={user.profile === 'admin'}
              rows={listRows}
              bookmarks={extra}
              files={fileRows}
              onCreate={createLibraryDocument}
              onBookmark={createLibraryBookmark}
              onOpen={openLibraryDocument}
              onOpenOriginal={openLibraryOriginal}
            />
          ) : null}

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

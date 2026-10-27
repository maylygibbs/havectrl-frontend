import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { CrewDataPanel } from './crew/CrewDataPanel';
import { CrewDirectory } from './crew/CrewDirectory';
import { CrewExperiencePanel } from './crew/CrewExperiencePanel';
import { CrewSchedulePanel } from './crew/CrewSchedulePanel';
import { defaultAssignmentRange, licenseAlert, toDatetimeLocalValue } from './crew/crew-utils';

export type CrewDocumentForm = {
  category: string;
  title: string;
  documentNumber: string;
  issuer: string;
  expiresOn: string;
  effectiveOn: string;
  privateNote: string;
  status: string;
};

export type WorkerForm = {
  employeeCode: string;
  fullName: string;
  position: string;
  base: string;
  status: string;
  licenseNumber: string;
  licenseExpires: string;
  medicalExpires: string;
};

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  scheduleRows: Record<string, unknown>[];
  detail: Record<string, unknown> | null;
  form: WorkerForm;
  showForm: boolean;
  editingId: string | null;
  onSelect: (id: string) => void;
  onFormChange: (form: WorkerForm) => void;
  onShowForm: (show: boolean) => void;
  onStartCreate: () => void;
  onStartEdit: (row: Record<string, unknown>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
  onCreateAssignment: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  assignableFlights: { code: string; origin: string; destination: string; registration: string }[];
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onRequestChange: (assignmentId: string, reason: string) => void;
  onReviewChange: (requestId: string, decision: 'approve' | 'reject') => void;
  onReviewDocument: (id: string, decision: 'accept' | 'reject') => void;
  onExportPdf: (kind: 'profile' | 'schedule' | 'experience') => void;
  onAddPrevious: (origin: string, minutes: string, asOf: string) => void;
  crewDocumentForm: CrewDocumentForm;
  showCrewDocumentForm: boolean;
  editingCrewDocumentId: string | null;
  onCrewDocumentFormChange: (form: CrewDocumentForm) => void;
  onShowCrewDocumentForm: (show: boolean) => void;
  onStartCreateCrewDocument: (category: string) => void;
  onStartEditCrewDocument: (row: Record<string, unknown>) => void;
  onSubmitCrewDocument: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteCrewDocument: (id: string) => void;
  fileRows: Record<string, unknown>[];
  onUploadFile: (file: File) => void;
  onDownloadFile: (id: string, name: string) => void;
  onPreviewFile: (id: string, name: string, mime: string) => void;
  onDeleteFile: (id: string) => void;
};

function WorkerFormFields({
  copy,
  form,
  editingId,
  onFormChange,
  onSubmit,
  onCancel,
}: {
  copy: ReturnType<typeof t>;
  form: WorkerForm;
  editingId: string | null;
  onFormChange: (form: WorkerForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="stack" onSubmit={onSubmit}>
      <label htmlFor="employeeCode">{copy.crew.employeeCode}</label>
      <input
        id="employeeCode"
        value={form.employeeCode}
        onChange={(e) => onFormChange({ ...form, employeeCode: e.target.value })}
        required
      />
      <label htmlFor="fullName">{copy.crew.fullName}</label>
      <input
        id="fullName"
        value={form.fullName}
        onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
        required
      />
      <label htmlFor="position">{copy.crew.position}</label>
      <input
        id="position"
        value={form.position}
        onChange={(e) => onFormChange({ ...form, position: e.target.value })}
        required
      />
      <label htmlFor="base">{copy.crew.base}</label>
      <input
        id="base"
        value={form.base}
        onChange={(e) => onFormChange({ ...form, base: e.target.value })}
        required
      />
      <label htmlFor="status">{copy.crew.status}</label>
      <input id="status" value={form.status} onChange={(e) => onFormChange({ ...form, status: e.target.value })} />
      <label htmlFor="licenseNumber">{copy.crew.licenseNumber}</label>
      <input
        id="licenseNumber"
        value={form.licenseNumber}
        onChange={(e) => onFormChange({ ...form, licenseNumber: e.target.value })}
      />
      <label htmlFor="licenseExpires">{copy.crew.licenseExpires}</label>
      <input
        id="licenseExpires"
        type="date"
        value={form.licenseExpires}
        onChange={(e) => onFormChange({ ...form, licenseExpires: e.target.value })}
      />
      <label htmlFor="medicalExpires">{copy.crew.medicalExpires}</label>
      <input
        id="medicalExpires"
        type="date"
        value={form.medicalExpires}
        onChange={(e) => onFormChange({ ...form, medicalExpires: e.target.value })}
      />
      <div className="actions">
        <button type="submit">{editingId ? copy.save : copy.create}</button>
        <button type="button" className="ghost" onClick={onCancel}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}

export function CrewPage({
  locale,
  rows,
  detail,
  form,
  showForm,
  editingId,
  onSelect,
  onFormChange,
  onShowForm,
  onStartCreate,
  onStartEdit,
  onSubmit,
  onDelete,
  scheduleRows,
  onCreateAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onRequestChange,
  onReviewChange,
  onReviewDocument,
  onExportPdf,
  onAddPrevious,
  assignableFlights,
  crewDocumentForm,
  showCrewDocumentForm,
  editingCrewDocumentId,
  onCrewDocumentFormChange,
  onShowCrewDocumentForm,
  onStartCreateCrewDocument,
  onStartEditCrewDocument,
  onSubmitCrewDocument,
  onDeleteCrewDocument,
  fileRows,
  onUploadFile,
  onDownloadFile,
  onPreviewFile,
  onDeleteFile,
}: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'data' | 'schedule' | 'experience'>('data');
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentStart, setAssignmentStart] = useState('');
  const [assignmentEnd, setAssignmentEnd] = useState('');
  const [flightCode, setFlightCode] = useState('');

  useEffect(() => {
    if (!assignmentOpen) return;
    const { start, end } = defaultAssignmentRange();
    setAssignmentStart(start);
    setAssignmentEnd(end);
  }, [assignmentOpen]);
  const selectedId = detail ? String(detail.id) : rows[0] ? String(rows[0].id) : null;

  useEffect(() => {
    const first = rows[0];
    if (!detail && first && 'full_name' in first) onSelect(String(first.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, detail?.id]);

  const directoryItems = useMemo(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        title: String(row.full_name ?? '—'),
        employeeCode: String(row.employee_code ?? '—'),
        position: String(row.position ?? '—'),
        base: String(row.base ?? '—'),
        status: String(row.status ?? 'active'),
        alert: licenseAlert(row.license_expires),
      })),
    [rows],
  );

  const crewRows = useMemo(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        full_name: String(row.full_name ?? '—'),
        position: String(row.position ?? '—'),
        status: String(row.status ?? 'active'),
      })),
    [rows],
  );

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    const ok = await onCreateAssignment(event);
    if (ok) setAssignmentOpen(false);
  }

  return (
    <div className="module-page crew-module">
      <ModuleHero
        title={copy.modules.crew}
        subtitle={copy.crew.heroSubtitle}
        image="/heroes/hero-crew.png"
      />

      <header className={`module-head crew-module-head${tab === 'schedule' ? ' crew-module-head-schedule' : ''}`}>
        <ModuleTabs
          tabs={[
            { id: 'data', label: copy.tabs.crewData },
            { id: 'schedule', label: copy.tabs.crewSchedule },
            { id: 'experience', label: copy.tabs.crewExperience },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
        {tab === 'schedule' ? (
          <button
            type="button"
            className="crew-assign-flight-btn"
            onClick={() => {
              const id = selectedId ?? (rows[0] ? String(rows[0].id) : null);
              if (!id) return;
              onSelect(id);
              setAssignmentOpen(true);
            }}
          >
            {copy.crew.assignFlight}
          </button>
        ) : null}
      </header>

      <Modal
        open={showForm}
        title={editingId ? copy.crew.edit : copy.crew.newWorker}
        closeLabel={copy.cancel}
        onClose={() => onShowForm(false)}
      >
        <WorkerFormFields
          copy={copy}
          form={form}
          editingId={editingId}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          onCancel={() => onShowForm(false)}
        />
      </Modal>

      <Modal
        open={showCrewDocumentForm}
        title={editingCrewDocumentId ? copy.aircraftForm.editDocument : copy.crew.newDocument}
        closeLabel={copy.cancel}
        onClose={() => onShowCrewDocumentForm(false)}
      >
        <form className="stack" onSubmit={onSubmitCrewDocument}>
          <label htmlFor="crew-doc-title">{copy.columns.title}</label>
          <input
            id="crew-doc-title"
            value={crewDocumentForm.title}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, title: e.target.value })}
            required
          />
          <label htmlFor="crew-doc-number">{copy.crew.documentNumber}</label>
          <input
            id="crew-doc-number"
            value={crewDocumentForm.documentNumber}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, documentNumber: e.target.value })}
          />
          <label htmlFor="crew-doc-issuer">{copy.crew.issuer}</label>
          <input
            id="crew-doc-issuer"
            value={crewDocumentForm.issuer}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, issuer: e.target.value })}
          />
          <label htmlFor="crew-doc-effective">{copy.crew.effectiveOn}</label>
          <input
            id="crew-doc-effective"
            type="date"
            value={crewDocumentForm.effectiveOn}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, effectiveOn: e.target.value })}
          />
          <label htmlFor="crew-doc-expires">{copy.crew.documentExpires}</label>
          <input
            id="crew-doc-expires"
            type="date"
            value={crewDocumentForm.expiresOn}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, expiresOn: e.target.value })}
          />
          {crewDocumentForm.category === 'medical' ? (
            <>
              <label htmlFor="crew-doc-private">{copy.crew.privateNote}</label>
              <textarea
                id="crew-doc-private"
                rows={2}
                value={crewDocumentForm.privateNote}
                onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, privateNote: e.target.value })}
              />
            </>
          ) : null}
          <label htmlFor="crew-doc-status">{copy.columns.status}</label>
          <input
            id="crew-doc-status"
            value={crewDocumentForm.status}
            onChange={(e) => onCrewDocumentFormChange({ ...crewDocumentForm, status: e.target.value })}
          />
          <div className="actions">
            <button type="submit">{editingCrewDocumentId ? copy.save : copy.create}</button>
            <button type="button" className="ghost" onClick={() => onShowCrewDocumentForm(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={assignmentOpen}
        title={copy.crew.newAssignment}
        closeLabel={copy.cancel}
        onClose={() => setAssignmentOpen(false)}
      >
        <form className="stack" onSubmit={submitAssignment}>
          {detail ? (
            <p className="status crew-assignment-for">
              {copy.crew.assignmentForWorker}: <strong>{String(detail.full_name)}</strong>
            </p>
          ) : (
            <p className="status">{copy.crew.assignmentNeedWorker}</p>
          )}
          <label htmlFor="assignment-activity">{copy.crew.assignmentActivity}</label>
          <select id="assignment-activity" name="activity" required defaultValue="Flight Duty">
            <option value="Flight Duty">{copy.crew.activityFlight}</option>
            <option value="Work">{copy.crew.activityWork}</option>
            <option value="Standby">{copy.crew.activityStandby}</option>
            <option value="Training">{copy.crew.activityTraining}</option>
            <option value="Rest">{copy.crew.activityRest}</option>
            <option value="Day Off">{copy.crew.activityDayOff}</option>
            <option value="Unavailable">{copy.crew.activityUnavailable}</option>
          </select>
          <label htmlFor="assignment-flight-code">{copy.crew.flightCode}</label>
          <select
            id="assignment-flight-code"
            name="flightCode"
            value={flightCode}
            onChange={(event) => setFlightCode(event.target.value)}
          >
            <option value="">{copy.crew.chooseFlight}</option>
            {assignableFlights.map((flight) => (
              <option key={flight.code} value={flight.code}>
                {flight.code} {flight.origin}-{flight.destination} {flight.registration}
              </option>
            ))}
          </select>
          <input type="hidden" name="origin" value={assignableFlights.find((flight) => flight.code === flightCode)?.origin ?? ''} />
          <input type="hidden" name="destination" value={assignableFlights.find((flight) => flight.code === flightCode)?.destination ?? ''} />
          <input type="hidden" name="aircraftRegistration" value={assignableFlights.find((flight) => flight.code === flightCode)?.registration ?? ''} />
          <label htmlFor="assignment-start">{copy.crew.startsAt}</label>
          <input
            id="assignment-start"
            name="startsAt"
            type="datetime-local"
            required
            value={assignmentStart}
            onChange={(e) => {
              const value = e.target.value;
              setAssignmentStart(value);
              if (!value) return;
              const start = new Date(value);
              const end = new Date(assignmentEnd);
              if (!assignmentEnd || Number.isNaN(end.getTime()) || end <= start) {
                const bumped = new Date(start);
                bumped.setHours(bumped.getHours() + 2);
                setAssignmentEnd(toDatetimeLocalValue(bumped));
              }
            }}
          />
          <label htmlFor="assignment-end">{copy.crew.endsAt}</label>
          <input
            id="assignment-end"
            name="endsAt"
            type="datetime-local"
            required
            value={assignmentEnd}
            min={assignmentStart || undefined}
            onChange={(e) => setAssignmentEnd(e.target.value)}
          />
          <label htmlFor="assignment-notes">{copy.crew.notes}</label>
          <input id="assignment-notes" name="notes" placeholder={copy.crew.assignmentNotesHint} />
          <div className="actions">
            <button type="submit" disabled={!detail?.id}>
              {copy.create}
            </button>
            <button type="button" className="ghost" onClick={() => setAssignmentOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      <div className={tab === 'schedule' ? 'crew-shell crew-shell-roster' : 'crew-shell split-layout'}>
        {tab !== 'schedule' ? (
          <CrewDirectory
            locale={locale}
            items={directoryItems}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddWorker={onStartCreate}
            empty={copy.empty}
          />
        ) : null}

        <div className={tab === 'schedule' ? 'crew-roster-page' : 'split-main crew-main'}>
          {tab === 'data' ? (
            detail ? (
              <CrewDataPanel
                locale={locale}
                detail={detail}
                onEdit={() => onStartEdit(detail)}
                onEditLicenses={() => onStartEdit(detail)}
                onDeactivate={() => onDelete(String(detail.id))}
                onAddDocument={onStartCreateCrewDocument}
                onEditDocument={onStartEditCrewDocument}
                onDeleteDocument={onDeleteCrewDocument}
                onReviewDocument={onReviewDocument}
                fileRows={fileRows}
                onUploadFile={onUploadFile}
                onDownloadFile={onDownloadFile}
                onPreviewFile={onPreviewFile}
                onDeleteFile={onDeleteFile}
              />
            ) : (
              <p className="status">{copy.crew.selectWorker}</p>
            )
          ) : null}

          {tab === 'schedule' ? (
            <CrewSchedulePanel
              locale={locale}
              crewRows={crewRows}
              scheduleRows={scheduleRows}
              onAddAssignment={(workerId) => {
                if (workerId) onSelect(workerId);
                setAssignmentOpen(true);
              }}
              onDeleteAssignment={onDeleteAssignment}
              onPublishAssignment={onPublishAssignment}
              onRequestChange={onRequestChange}
              onSelectWorker={onSelect}
            />
          ) : null}

          {tab === 'schedule' && detail && Array.isArray(detail.changeRequests) ? (
            <ul>
              {(detail.changeRequests as Record<string, unknown>[]).map((row) => (
                <li key={String(row.id)}>
                  {String(row.reason ?? '')} · {String(row.status ?? '')}
                  {String(row.status) === 'requested' ? (
                    <span className="actions">
                      <button type="button" className="ghost btn-compact" onClick={() => onReviewChange(String(row.id), 'approve')}>
                        {copy.crew.accept}
                      </button>
                      <button type="button" className="ghost btn-compact" onClick={() => onReviewChange(String(row.id), 'reject')}>
                        {copy.crew.reject}
                      </button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'experience' ? (
            <CrewExperiencePanel locale={locale} detail={detail} onExport={onExportPdf} onAddPrevious={onAddPrevious} />
          ) : null}
          {tab === 'data' && detail ? (
            <div className="actions">
              <button type="button" className="ghost btn-compact" onClick={() => onExportPdf('profile')}>
                {copy.crew.exportPdf}
              </button>
              <button type="button" className="ghost btn-compact" onClick={() => onExportPdf('schedule')}>
                {copy.tabs.crewSchedule}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

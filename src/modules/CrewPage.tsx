import { FormEvent, useMemo, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
import { ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { CrewDataPanel } from './crew/CrewDataPanel';
import { CrewDirectory } from './crew/CrewDirectory';
import { CrewExperiencePanel } from './crew/CrewExperiencePanel';
import { CrewSchedulePanel } from './crew/CrewSchedulePanel';
import { type RosterAssignment } from './crew/crew-schedule-roster';
import { assignmentRangeOnDay, defaultAssignmentRange, licenseAlert, toDatetimeLocalValue } from './crew/crew-utils';

export type AssignmentSave = {
  workerIds: string[];
  activity: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  flightCode: string | null;
  origin: string | null;
  destination: string | null;
  aircraftRegistration: string | null;
};

type AssignmentDraft = {
  mode: 'create' | 'edit';
  id: string | null;
  lockedWorkerId: string | null;
  lockedName: string;
  dayLabel: string;
  workerIds: string[];
  activity: string;
  flightCode: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

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

export type WorkerFocus = 'identity' | 'license' | 'medical';

export type WorkerForm = {
  employeeCode: string;
  fullName: string;
  position: string;
  base: string;
  team: string;
  email: string;
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
  workerFocus: WorkerFocus;
  editingId: string | null;
  onSelect: (id: string) => void;
  onFormChange: (form: WorkerForm) => void;
  onShowForm: (show: boolean) => void;
  onStartCreate: () => void;
  onStartEdit: (row: Record<string, unknown>, focus?: WorkerFocus) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
  onCreateAssignment: (payload: AssignmentSave) => Promise<boolean>;
  onUpdateAssignment: (id: string, payload: AssignmentSave) => Promise<boolean>;
  onMoveAssignment: (id: string, dayKey: string) => Promise<void>;
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
  focus,
  editingId,
  positions,
  bases,
  onFormChange,
  onSubmit,
  onCancel,
}: {
  copy: ReturnType<typeof t>;
  form: WorkerForm;
  focus: WorkerFocus;
  editingId: string | null;
  positions: string[];
  bases: string[];
  onFormChange: (form: WorkerForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const teams = [
    { value: 'operations', label: copy.crew.teamOperations },
    { value: 'maintenance', label: copy.crew.teamMaintenance },
    { value: 'cabin', label: copy.crew.teamCabin },
  ];
  return (
    <form className="stack" onSubmit={onSubmit}>
      {focus === 'identity' ? (
        <>
          <label htmlFor="fullName">{copy.crew.fullName}</label>
          <input id="fullName" value={form.fullName} onChange={(e) => onFormChange({ ...form, fullName: e.target.value })} required />
          <label htmlFor="employeeCode">{copy.crew.employeeCode}</label>
          <input id="employeeCode" value={form.employeeCode} onChange={(e) => onFormChange({ ...form, employeeCode: e.target.value })} required />
          <label htmlFor="position">{copy.crew.position}</label>
          <Autocomplete
            id="position"
            allowCustom
            options={positions.map((value) => ({ value, label: value }))}
            values={form.position ? [form.position] : []}
            placeholder={copy.crew.position}
            emptyLabel={copy.empty}
            onChange={(values) => onFormChange({ ...form, position: values[0] ?? '' })}
          />
          <label htmlFor="base">{copy.crew.base}</label>
          <Autocomplete
            id="base"
            allowCustom
            options={bases.map((value) => ({ value, label: value }))}
            values={form.base ? [form.base] : []}
            placeholder={copy.crew.base}
            emptyLabel={copy.empty}
            onChange={(values) => onFormChange({ ...form, base: values[0] ?? '' })}
          />
          <span id="team-label">{copy.crew.team}</span>
          <div className="magic-filters" role="group" aria-labelledby="team-label">
            {teams.map((team) => (
              <button
                key={team.value}
                type="button"
                className={`magic-chip${form.team === team.value ? ' is-on' : ''}`}
                onClick={() => onFormChange({ ...form, team: team.value })}
              >
                {team.label}
              </button>
            ))}
          </div>
          <label htmlFor="workerEmail">{copy.email}</label>
          <input id="workerEmail" type="email" value={form.email} onChange={(e) => onFormChange({ ...form, email: e.target.value })} />
          {editingId ? (
            <>
              <span id="status-label">{copy.crew.status}</span>
              <div className="magic-filters" role="group" aria-labelledby="status-label">
                <button type="button" className={`magic-chip${form.status === 'active' ? ' is-on' : ''}`} onClick={() => onFormChange({ ...form, status: 'active' })}>
                  {copy.crew.filterActive}
                </button>
                <button type="button" className={`magic-chip${form.status === 'inactive' ? ' is-on' : ''}`} onClick={() => onFormChange({ ...form, status: 'inactive' })}>
                  {copy.crew.filterInactive}
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      {focus === 'license' ? (
        <>
          <label htmlFor="licenseNumber">{copy.crew.licenseNumber}</label>
          <input id="licenseNumber" value={form.licenseNumber} onChange={(e) => onFormChange({ ...form, licenseNumber: e.target.value })} />
          <label htmlFor="licenseExpires">{copy.crew.licenseExpires}</label>
          <input id="licenseExpires" type="date" value={form.licenseExpires} onChange={(e) => onFormChange({ ...form, licenseExpires: e.target.value })} />
        </>
      ) : null}
      {focus === 'medical' ? (
        <>
          <label htmlFor="medicalExpires">{copy.crew.medicalExpires}</label>
          <input id="medicalExpires" type="date" value={form.medicalExpires} onChange={(e) => onFormChange({ ...form, medicalExpires: e.target.value })} />
        </>
      ) : null}
      <div className="actions">
        <button type="submit" disabled={focus === 'identity' && (!form.position || !form.base || !form.team)}>
          {focus === 'identity' && !editingId ? copy.crew.createWorker : copy.save}
        </button>
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
  workerFocus,
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
  onUpdateAssignment,
  onMoveAssignment,
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
  const [draft, setDraft] = useState<AssignmentDraft | null>(null);
  const selectedId = detail ? String(detail.id) : null;

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

  function blankDraft(): AssignmentDraft {
    const range = defaultAssignmentRange();
    return {
      mode: 'create',
      id: null,
      lockedWorkerId: null,
      lockedName: '',
      dayLabel: '',
      workerIds: [],
      activity: '',
      flightCode: '',
      startsAt: range.start,
      endsAt: range.end,
      notes: '',
    };
  }

  function openOnDay(workerId: string, dayKey: string) {
    const person = rows.find((row) => String(row.id) === workerId);
    const range = assignmentRangeOnDay(dayKey);
    setDraft({
      mode: 'create',
      id: null,
      lockedWorkerId: workerId,
      lockedName: person ? String(person.full_name ?? '') : '',
      dayLabel: dayKey,
      workerIds: [workerId],
      activity: '',
      flightCode: '',
      startsAt: range.start,
      endsAt: range.end,
      notes: '',
    });
  }

  function openEdit(row: RosterAssignment) {
    const person = rows.find((item) => String(item.id) === row.worker_id);
    setDraft({
      mode: 'edit',
      id: row.id,
      lockedWorkerId: row.worker_id,
      lockedName: person ? String(person.full_name ?? '') : '',
      dayLabel: '',
      workerIds: [row.worker_id],
      activity: row.activity,
      flightCode: row.flight_code ?? '',
      startsAt: toDatetimeLocalValue(new Date(row.starts_at)),
      endsAt: toDatetimeLocalValue(new Date(row.ends_at)),
      notes: row.notes ?? '',
    });
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const form = event.currentTarget;
    const flight = assignableFlights.find((item) => item.code === draft.flightCode);
    const payload: AssignmentSave = {
      workerIds: draft.lockedWorkerId ? [draft.lockedWorkerId] : draft.workerIds,
      activity: draft.activity,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      notes: String(new FormData(form).get('notes') ?? draft.notes),
      flightCode: draft.activity === 'Flight Duty' ? draft.flightCode || null : null,
      origin: flight?.origin ?? null,
      destination: flight?.destination ?? null,
      aircraftRegistration: flight?.registration ?? null,
    };
    const ok = draft.mode === 'edit' && draft.id
      ? await onUpdateAssignment(draft.id, payload)
      : await onCreateAssignment(payload);
    if (ok) setDraft(null);
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
          <button type="button" className="crew-assign-flight-btn" onClick={() => setDraft(blankDraft())}>
            {copy.crew.assignEntry}
          </button>
        ) : null}
      </header>

      <Modal
        open={showForm}
        title={
          workerFocus === 'license'
            ? copy.crew.editLicenses
            : workerFocus === 'medical'
              ? copy.crew.editMedical
              : editingId
                ? copy.crew.edit
                : copy.crew.newWorker
        }
        closeLabel={copy.cancel}
        onClose={() => onShowForm(false)}
      >
        <WorkerFormFields
          copy={copy}
          form={form}
          focus={workerFocus}
          editingId={editingId}
          positions={[...new Set(rows.map((row) => String(row.position ?? '')).filter(Boolean))]}
          bases={[...new Set(rows.map((row) => String(row.base ?? '')).filter(Boolean))]}
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
        open={draft !== null}
        title={draft?.mode === 'edit' ? copy.crew.editAssignment : copy.crew.newAssignment}
        closeLabel={copy.cancel}
        onClose={() => setDraft(null)}
      >
        {draft ? (
          <form className="stack" onSubmit={submitAssignment}>
            {draft.lockedWorkerId ? (
              <p className="status crew-assignment-for">
                {copy.crew.assignmentForWorker}: <strong>{draft.lockedName}</strong>
                {draft.dayLabel ? ` · ${draft.dayLabel}` : ''}
              </p>
            ) : (
              <>
                <label htmlFor="assignment-people">{copy.crew.assignmentPeople}</label>
                <Autocomplete
                  id="assignment-people"
                  multiple
                  options={rows.map((row) => ({ value: String(row.id), label: String(row.full_name ?? '') }))}
                  values={draft.workerIds}
                  placeholder={copy.crew.searchCrew}
                  emptyLabel={copy.empty}
                  onChange={(workerIds) => setDraft({ ...draft, workerIds })}
                />
              </>
            )}
            <label htmlFor="assignment-activity">{copy.crew.assignmentActivity}</label>
            <Autocomplete
              id="assignment-activity"
              options={[
                { value: 'Flight Duty', label: copy.crew.activityFlight },
                { value: 'Work', label: copy.crew.activityWork },
                { value: 'Standby', label: copy.crew.activityStandby },
                { value: 'Training', label: copy.crew.activityTraining },
                { value: 'Rest', label: copy.crew.activityRest },
                { value: 'Day Off', label: copy.crew.activityDayOff },
                { value: 'Absence', label: copy.crew.activityAbsence },
                { value: 'Unavailable', label: copy.crew.activityUnavailable },
              ]}
              values={draft.activity ? [draft.activity] : []}
              placeholder={copy.crew.searchActivity}
              emptyLabel={copy.empty}
              onChange={(values) =>
                setDraft({
                  ...draft,
                  activity: values[0] ?? '',
                  flightCode: values[0] === 'Flight Duty' ? draft.flightCode : '',
                })
              }
            />
            {draft.activity === 'Flight Duty' ? (
              <>
                <label htmlFor="assignment-flight-code">{copy.crew.flightCode}</label>
                <Autocomplete
                  id="assignment-flight-code"
                  options={assignableFlights.map((flight) => ({
                    value: flight.code,
                    label: `${flight.code} ${flight.origin}-${flight.destination} ${flight.registration}`,
                  }))}
                  values={draft.flightCode ? [draft.flightCode] : []}
                  placeholder={copy.crew.searchFlight}
                  emptyLabel={copy.empty}
                  onChange={(values) => setDraft({ ...draft, flightCode: values[0] ?? '' })}
                />
              </>
            ) : null}
            <label htmlFor="assignment-start">{copy.crew.startsAt}</label>
            <input
              id="assignment-start"
              name="startsAt"
              type="datetime-local"
              required
              value={draft.startsAt}
              onChange={(event) => {
                const value = event.target.value;
                const start = new Date(value);
                const end = new Date(draft.endsAt);
                let endsAt = draft.endsAt;
                if (value && (Number.isNaN(end.getTime()) || end <= start)) {
                  const bumped = new Date(start);
                  bumped.setHours(bumped.getHours() + 2);
                  endsAt = toDatetimeLocalValue(bumped);
                }
                setDraft({ ...draft, startsAt: value, endsAt });
              }}
            />
            <label htmlFor="assignment-end">{copy.crew.endsAt}</label>
            <input
              id="assignment-end"
              name="endsAt"
              type="datetime-local"
              required
              value={draft.endsAt}
              min={draft.startsAt || undefined}
              onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
            />
            <label htmlFor="assignment-notes">{copy.crew.notes}</label>
            <input id="assignment-notes" name="notes" defaultValue={draft.notes} placeholder={copy.crew.assignmentNotesHint} />
            <div className="actions">
              <button
                type="submit"
                disabled={
                  (!draft.lockedWorkerId && draft.workerIds.length === 0) ||
                  !draft.activity ||
                  (draft.activity === 'Flight Duty' && !draft.flightCode)
                }
              >
                {copy.save}
              </button>
              <button type="button" className="ghost" onClick={() => setDraft(null)}>
                {copy.cancel}
              </button>
            </div>
          </form>
        ) : null}
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
                onEdit={() => onStartEdit(detail, 'identity')}
                onEditLicenses={() => onStartEdit(detail, 'license')}
                onEditMedical={() => onStartEdit(detail, 'medical')}
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
              onCreateAt={openOnDay}
              onEdit={openEdit}
              onMove={onMoveAssignment}
              onDeleteAssignment={onDeleteAssignment}
              onPublishAssignment={onPublishAssignment}
              onRequestChange={onRequestChange}
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

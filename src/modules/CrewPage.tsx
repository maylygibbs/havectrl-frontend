import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, MasterList, ModuleHero, ModuleTabs, StatusPill } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { TableSearchBar } from '../ui/TableSearchBar';
import { filterRowsBySearch } from '../ui/table-filter';
import { DataTable, DetailPanel, cellText } from '../ui/table';

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
  onDeleteAssignment: (assignmentId: string) => void;
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
}: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'data' | 'schedule' | 'experience'>('data');
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const scheduleVisible = useMemo(
    () => filterRowsBySearch(scheduleRows, scheduleSearch),
    [scheduleRows, scheduleSearch],
  );
  const selectedId = detail ? String(detail.id) : rows[0] ? String(rows[0].id) : null;

  useEffect(() => {
    const first = rows[0];
    if (!detail && first && 'full_name' in first) onSelect(String(first.id));
    // Auto-select first crew member once list loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, detail?.id]);

  const items = useMemo(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        title: String(row.full_name ?? '—'),
        subtitle: `${row.position ?? '—'} · ${row.base ?? '—'}`,
        status: String(row.status ?? 'active'),
      })),
    [rows],
  );

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    const ok = await onCreateAssignment(event);
    if (ok) setAssignmentOpen(false);
  }

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.crew}
        subtitle={copy.moduleSubs.crew}
        image="/heroes/hero-crew.png"
      />
      <header className="module-head">
        <ModuleTabs
          tabs={[
            { id: 'data', label: copy.tabs.crewData },
            { id: 'schedule', label: copy.tabs.crewSchedule },
            { id: 'experience', label: copy.tabs.crewExperience },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
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
        open={assignmentOpen}
        title={copy.crew.newAssignment}
        closeLabel={copy.cancel}
        onClose={() => setAssignmentOpen(false)}
      >
        <form className="stack" onSubmit={submitAssignment}>
          <label htmlFor="assignment-activity">{copy.crew.assignmentActivity}</label>
          <input id="assignment-activity" name="activity" required placeholder="Flight Duty, Work, Standby…" />
          <label htmlFor="assignment-start">{copy.crew.startsAt}</label>
          <input id="assignment-start" name="startsAt" type="datetime-local" required />
          <label htmlFor="assignment-end">{copy.crew.endsAt}</label>
          <input id="assignment-end" name="endsAt" type="datetime-local" required />
          <label htmlFor="assignment-notes">{copy.crew.notes}</label>
          <input id="assignment-notes" name="notes" />
          <div className="actions">
            <button type="submit">{copy.create}</button>
            <button type="button" className="ghost" onClick={() => setAssignmentOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      {tab === 'data' ? (
        <div className="split-layout">
          <MasterList
            title={copy.crew.title}
            actionLabel={copy.crew.newWorker}
            onAction={onStartCreate}
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            empty={copy.empty}
            locale={locale}
          />
          <div className="split-main">
            {detail ? (
              <DataPanel
                title={String(detail.full_name ?? copy.crew.title)}
                action={
                  <div className="actions">
                    <button type="button" className="ghost btn-compact" onClick={() => onStartEdit(detail)}>
                      {copy.crew.edit}
                    </button>
                    <button type="button" className="ghost danger btn-compact" onClick={() => onDelete(String(detail.id))}>
                      {copy.softDelete}
                    </button>
                  </div>
                }
              >
                <div className="profile-grid">
                  <div>
                    <p className="muted-label">{copy.crew.employeeCode}</p>
                    <p>{cellText(detail.employee_code)}</p>
                  </div>
                  <div>
                    <p className="muted-label">{copy.crew.position}</p>
                    <p>{cellText(detail.position)}</p>
                  </div>
                  <div>
                    <p className="muted-label">{copy.crew.base}</p>
                    <p>{cellText(detail.base)}</p>
                  </div>
                  <div>
                    <p className="muted-label">{copy.crew.status}</p>
                    <StatusPill status={String(detail.status ?? 'active')} />
                  </div>
                  <div>
                    <p className="muted-label">{copy.crew.licenseExpires}</p>
                    <p>{cellText(detail.license_expires)}</p>
                  </div>
                </div>
                {Array.isArray(detail.assignments) ? (
                  <>
                    <h3>{copy.tabs.crewSchedule}</h3>
                    <DataTable
                      rows={detail.assignments as Record<string, unknown>[]}
                      columns={['activity', 'starts_at', 'ends_at', 'notes']}
                      locale={locale}
                    />
                  </>
                ) : null}
                {Array.isArray(detail.experience) ? (
                  <>
                    <h3>{copy.tabs.crewExperience}</h3>
                    <DataTable
                      rows={detail.experience as Record<string, unknown>[]}
                      columns={['category', 'hours', 'as_of']}
                      locale={locale}
                    />
                  </>
                ) : null}
              </DataPanel>
            ) : (
              <p className="status">{copy.empty}</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'schedule' ? (
        <>
          <div className="module-toolbar">
            <button type="button" disabled={!detail} onClick={() => setAssignmentOpen(true)}>
              {copy.crew.newAssignment}
            </button>
          </div>
          <DataPanel title={copy.tabs.crewSchedule}>
            <div className="table-stack">
              {scheduleRows.length > 0 ? (
                <TableSearchBar locale={locale} value={scheduleSearch} onChange={setScheduleSearch} />
              ) : null}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{copy.columns.full_name}</th>
                    <th>{copy.columns.activity}</th>
                    <th>{copy.columns.starts_at}</th>
                    <th>{copy.columns.ends_at}</th>
                    <th>{copy.columns.notes}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="status">{copy.empty}</p>
                      </td>
                    </tr>
                  ) : scheduleVisible.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="status">{copy.empty}</p>
                      </td>
                    </tr>
                  ) : (
                    scheduleVisible.map((row) => (
                      <tr key={String(row.id)}>
                        <td>{cellText(row.full_name)}</td>
                        <td>{cellText(row.activity)}</td>
                        <td>{cellText(row.starts_at)}</td>
                        <td>{cellText(row.ends_at)}</td>
                        <td>{cellText(row.notes)}</td>
                        <td>
                          <button
                            type="button"
                            className="ghost danger btn-compact"
                            onClick={() => onDeleteAssignment(String(row.id))}
                          >
                            {copy.softDelete}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </DataPanel>
        </>
      ) : null}

      {tab === 'experience' ? (
        <DataPanel title={copy.tabs.crewExperience}>
          {detail ? <DetailPanel data={{ experience: detail.experience ?? [] }} locale={locale} /> : <p className="status">{copy.empty}</p>}
        </DataPanel>
      ) : null}
    </div>
  );
}

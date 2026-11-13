import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Kind = 'inspection' | 'discrepancy' | 'order' | null;

type Props = {
  locale: Locale;
  inspections: Record<string, unknown>[];
  discrepancies: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  logReviews: Record<string, unknown>[];
  aircraft: Record<string, unknown>[];
  onCreateInspection: (body: Record<string, unknown>) => Promise<boolean>;
  onCreateDiscrepancy: (body: Record<string, unknown>) => Promise<boolean>;
  onCreateOrder: (body: Record<string, unknown>) => Promise<boolean>;
};

const empty = () => ({
  aircraftId: '',
  title: '',
  dueDate: '',
  dueHours: '',
  inspectionStatus: 'scheduled',
  description: '',
  correctiveAction: '',
  discrepancyStatus: 'open',
  discrepancyId: '',
  assignedTo: '',
  orderStatus: 'open',
  evidence: '',
});

export function MaintenancePage({
  locale,
  inspections,
  discrepancies,
  orders,
  logReviews,
  aircraft,
  onCreateInspection,
  onCreateDiscrepancy,
  onCreateOrder,
}: Props) {
  const copy = t(locale);
  const formCopy = copy.maintenanceForm;
  const [tab, setTab] = useState<'overview' | 'inspections' | 'discrepancies' | 'orders' | 'log'>('overview');
  const [kind, setKind] = useState<Kind>(null);
  const [form, setForm] = useState(empty());
  const aircraftOptions = aircraft.map((row) => ({
    value: String(row.id),
    label: `${String(row.registration)} · ${String(row.model ?? '')}`,
  }));
  const findingOptions = discrepancies
    .filter((row) => !form.aircraftId || String(row.aircraft_id) === form.aircraftId)
    .map((row) => ({ value: String(row.id), label: `${String(row.registration)} · ${String(row.title)}` }));
  const assignees = [...new Set(orders.map((row) => String(row.assigned_to ?? '')).filter(Boolean))].map((value) => ({
    value,
    label: value,
  }));

  function open(next: Kind) {
    setForm(empty());
    setKind(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let ok = false;
    if (kind === 'inspection') {
      ok = await onCreateInspection({
        aircraftId: form.aircraftId,
        title: form.title,
        dueDate: form.dueDate || null,
        dueHours: form.dueHours.trim() === '' ? null : Number(form.dueHours),
        status: form.inspectionStatus,
      });
    } else if (kind === 'discrepancy') {
      ok = await onCreateDiscrepancy({
        aircraftId: form.aircraftId,
        title: form.title,
        description: form.description,
        correctiveAction: form.correctiveAction,
        status: form.discrepancyStatus,
      });
    } else if (kind === 'order') {
      ok = await onCreateOrder({
        aircraftId: form.aircraftId,
        discrepancyId: form.discrepancyId || null,
        title: form.title,
        assignedTo: form.assignedTo,
        status: form.orderStatus,
        evidence: form.evidence,
      });
    }
    if (ok) setKind(null);
  }

  const title =
    kind === 'inspection' ? formCopy.registerInspection : kind === 'discrepancy' ? formCopy.registerDiscrepancy : formCopy.registerOrder;

  return (
    <div className="module-page">
      <ModuleHero title={copy.modules.maintenance} subtitle={copy.moduleSubs.maintenance} image="/heroes/hero-maintenance.png" />
      <ModuleTabs
        tabs={[
          { id: 'overview', label: copy.tabs.mxOverview },
          { id: 'inspections', label: copy.tabs.mxInspections },
          { id: 'discrepancies', label: copy.tabs.mxDiscrepancies },
          { id: 'orders', label: copy.tabs.mxOrders },
          { id: 'log', label: copy.tabs.mxLogReview },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'overview' ? (
        <div className="metric-grid metric-grid-4">
          <div className="metric-card static">
            <span className="metric-label">{copy.tabs.mxInspections}</span>
            <strong className="metric-value">{inspections.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.sections.discrepancies}</span>
            <strong className="metric-value">{discrepancies.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.sections.orders}</span>
            <strong className="metric-value">{orders.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.tabs.mxLogReview}</span>
            <strong className="metric-value">{logReviews.length}</strong>
          </div>
        </div>
      ) : null}

      {tab === 'inspections' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('inspection')}>
              {formCopy.registerInspection}
            </button>
          </div>
          <DataPanel title={copy.tabs.mxInspections}>
            <DataTable rows={inspections} columns={['registration', 'title', 'due_date', 'due_hours', 'status']} locale={locale} />
          </DataPanel>
        </>
      ) : null}

      {tab === 'discrepancies' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('discrepancy')}>
              {formCopy.registerDiscrepancy}
            </button>
          </div>
          <DataPanel title={copy.tabs.mxDiscrepancies}>
            <p className="status">{formCopy.notRelease}</p>
            <DataTable rows={discrepancies} columns={['registration', 'title', 'status', 'reported_by']} locale={locale} />
          </DataPanel>
        </>
      ) : null}

      {tab === 'orders' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('order')}>
              {formCopy.registerOrder}
            </button>
          </div>
          <DataPanel title={copy.tabs.mxOrders}>
            <p className="status">{formCopy.evidenceHint}</p>
            <DataTable rows={orders} columns={['registration', 'title', 'assigned_to', 'status', 'evidence']} locale={locale} />
          </DataPanel>
        </>
      ) : null}

      {tab === 'log' ? (
        <DataPanel title={copy.tabs.mxLogReview}>
          <p className="status">{formCopy.logNote}</p>
          <DataTable
            rows={logReviews}
            columns={['code', 'registration', 'pilot_name', 'flight_minutes', 'cycles', 'review_status']}
            locale={locale}
          />
        </DataPanel>
      ) : null}

      <Modal open={kind != null} title={title} closeLabel={copy.cancel} onClose={() => setKind(null)}>
        <form className="stack" onSubmit={submit}>
          <p className="status">{formCopy.notRelease}</p>
          <label htmlFor="mx-aircraft">{formCopy.aircraft}</label>
          <Autocomplete
            id="mx-aircraft"
            options={aircraftOptions}
            values={form.aircraftId ? [form.aircraftId] : []}
            placeholder={formCopy.aircraft}
            emptyLabel={copy.empty}
            onChange={(values) => setForm({ ...form, aircraftId: values[0] ?? '', discrepancyId: '' })}
          />
          <label htmlFor="mx-title">{formCopy.title}</label>
          <input id="mx-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          {kind === 'inspection' ? (
            <>
              <p className="status">{formCopy.dueHint}</p>
              <label htmlFor="mx-due">{formCopy.dueDate}</label>
              <input id="mx-due" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              <label htmlFor="mx-hours">{formCopy.dueHours}</label>
              <input id="mx-hours" type="number" min="0" step="0.1" value={form.dueHours} onChange={(event) => setForm({ ...form, dueHours: event.target.value })} />
              <ChipRow
                label={copy.flightsForm.status}
                value={form.inspectionStatus}
                options={[
                  ['scheduled', formCopy.statusScheduled],
                  ['due', formCopy.statusDue],
                  ['completed', formCopy.statusCompleted],
                ]}
                onChange={(value) => setForm({ ...form, inspectionStatus: value })}
              />
            </>
          ) : null}
          {kind === 'discrepancy' ? (
            <>
              <label htmlFor="mx-narrative">{formCopy.narrative}</label>
              <textarea id="mx-narrative" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
              <label htmlFor="mx-action">{formCopy.action}</label>
              <textarea id="mx-action" rows={2} value={form.correctiveAction} onChange={(event) => setForm({ ...form, correctiveAction: event.target.value })} />
              <ChipRow
                label={copy.flightsForm.status}
                value={form.discrepancyStatus}
                options={[
                  ['open', formCopy.statusOpen],
                  ['deferred', formCopy.statusDeferred],
                  ['closed', formCopy.statusClosed],
                ]}
                onChange={(value) => setForm({ ...form, discrepancyStatus: value })}
              />
            </>
          ) : null}
          {kind === 'order' ? (
            <>
              <label htmlFor="mx-finding">{formCopy.registerDiscrepancy}</label>
              <Autocomplete
                id="mx-finding"
                options={findingOptions}
                values={form.discrepancyId ? [form.discrepancyId] : []}
                placeholder={formCopy.registerDiscrepancy}
                emptyLabel={copy.empty}
                onChange={(values) => setForm({ ...form, discrepancyId: values[0] ?? '' })}
              />
              <label htmlFor="mx-assignee">{formCopy.assignee}</label>
              <Autocomplete
                id="mx-assignee"
                allowCustom
                options={assignees}
                values={form.assignedTo ? [form.assignedTo] : []}
                placeholder={formCopy.assignee}
                emptyLabel={copy.empty}
                onChange={(values) => setForm({ ...form, assignedTo: values[0] ?? '' })}
              />
              <p className="status">{formCopy.evidenceHint}</p>
              <label htmlFor="mx-evidence">{formCopy.evidence}</label>
              <textarea id="mx-evidence" rows={3} value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} />
              <ChipRow
                label={copy.flightsForm.status}
                value={form.orderStatus}
                options={[
                  ['open', formCopy.statusOpen],
                  ['in_progress', formCopy.statusInProgress],
                  ['done', formCopy.statusDone],
                ]}
                onChange={(value) => setForm({ ...form, orderStatus: value })}
              />
            </>
          ) : null}
          <div className="actions">
            <button type="submit" disabled={!form.aircraftId || (kind === 'order' && !form.assignedTo) || (kind === 'order' && form.orderStatus === 'done' && !form.evidence.trim())}>
              {title}
            </button>
            <button type="button" className="ghost" onClick={() => setKind(null)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ChipRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <>
      <span>{label}</span>
      <div className="magic-filters" role="group" aria-label={label}>
        {options.map(([id, text]) => (
          <button key={id} type="button" className={`magic-chip${value === id ? ' is-on' : ''}`} onClick={() => onChange(id)}>
            {text}
          </button>
        ))}
      </div>
    </>
  );
}

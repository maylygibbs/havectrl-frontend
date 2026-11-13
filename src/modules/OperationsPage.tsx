import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Kind = 'fee' | 'service' | 'expense' | 'payment' | null;

type Props = {
  locale: Locale;
  actorEmail: string;
  services: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  flights: Record<string, unknown>[];
  onCreateService: (body: Record<string, unknown>) => Promise<boolean>;
  onCreateExpense: (body: Record<string, unknown>) => Promise<boolean>;
  onApproveExpense: (id: string) => Promise<boolean>;
  onCreatePayment: (body: Record<string, unknown>) => Promise<boolean>;
};

const empty = () => ({
  provider: '',
  airport: '',
  amount: '',
  currency: 'USD',
  flightId: '',
  officialUrl: '',
  kind: 'fuel',
  status: 'requested',
  category: '',
  description: '',
  expenseStatus: 'draft',
  source: 'service' as 'service' | 'expense',
  sourceId: '',
  method: 'transfer',
  paymentStatus: 'recorded',
  reference: '',
});

export function OperationsPage({
  locale,
  actorEmail,
  services,
  expenses,
  payments,
  flights,
  onCreateService,
  onCreateExpense,
  onApproveExpense,
  onCreatePayment,
}: Props) {
  const copy = t(locale);
  const formCopy = copy.operationsForm;
  const [tab, setTab] = useState<'overview' | 'fees' | 'services' | 'payments' | 'documents'>('overview');
  const [kind, setKind] = useState<Kind>(null);
  const [form, setForm] = useState(empty());
  const fees = services.filter((row) => row.kind === 'fee');
  const operational = services.filter((row) => row.kind !== 'fee');
  const flightOptions = flights.map((row) => ({
    value: String(row.id),
    label: `${String(row.code)} · ${String(row.origin)}-${String(row.destination)}`,
  }));
  const providers = [...new Set(services.map((row) => String(row.provider ?? '')).filter(Boolean))].map((value) => ({
    value,
    label: value,
  }));

  function open(next: Kind) {
    setForm(empty());
    setKind(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    let ok = false;
    if (kind === 'fee' || kind === 'service') {
      ok = await onCreateService({
        kind: kind === 'fee' ? 'fee' : form.kind,
        provider: form.provider,
        airport: kind === 'fee' ? form.airport : null,
        amount,
        currency: form.currency,
        flightId: form.flightId || null,
        status: form.status,
        officialUrl: form.officialUrl || null,
      });
    } else if (kind === 'expense') {
      ok = await onCreateExpense({
        category: form.category,
        description: form.description,
        amount,
        currency: form.currency,
        flightId: form.flightId || null,
        status: form.expenseStatus,
      });
    } else if (kind === 'payment') {
      ok = await onCreatePayment({
        serviceId: form.source === 'service' ? form.sourceId : null,
        expenseId: form.source === 'expense' ? form.sourceId : null,
        amount,
        currency: form.currency,
        method: form.method,
        status: form.paymentStatus,
        officialUrl: form.officialUrl || null,
        reference: form.reference,
      });
    }
    if (ok) setKind(null);
  }

  const title =
    kind === 'fee'
      ? formCopy.registerFee
      : kind === 'service'
        ? formCopy.registerService
        : kind === 'expense'
          ? formCopy.registerExpense
          : formCopy.registerPayment;
  const obligations = (form.source === 'service' ? services : expenses).map((row) => ({
    value: String(row.id),
    label:
      form.source === 'service'
        ? `${String(row.provider)} · ${String(row.amount)} ${String(row.currency)}`
        : `${String(row.category)} · ${String(row.amount)} ${String(row.currency)}`,
  }));

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.operations}
        subtitle={copy.moduleSubs.operations}
        image="/heroes/hero-operations.png"
        meta="YV3500 · SVMI"
      />
      <ModuleTabs
        tabs={[
          { id: 'overview', label: copy.tabs.opsOverview },
          { id: 'fees', label: copy.tabs.opsFees },
          { id: 'services', label: copy.tabs.opsServices },
          { id: 'payments', label: copy.tabs.opsPayments },
          { id: 'documents', label: copy.tabs.opsDocuments },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'overview' ? (
        <div className="metric-grid metric-grid-4">
          <div className="metric-card static">
            <span className="metric-label">{copy.tabs.opsFees}</span>
            <strong className="metric-value">{fees.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.tabs.opsServices}</span>
            <strong className="metric-value">{operational.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.sections.expenses}</span>
            <strong className="metric-value">{expenses.length}</strong>
          </div>
          <div className="metric-card static">
            <span className="metric-label">{copy.tabs.opsPayments}</span>
            <strong className="metric-value">{payments.length}</strong>
          </div>
        </div>
      ) : null}

      {tab === 'fees' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('fee')}>
              {formCopy.registerFee}
            </button>
          </div>
          <DataPanel title={copy.tabs.opsFees}>
            <DataTable rows={fees} columns={['flight_code', 'airport', 'provider', 'amount', 'currency', 'status']} locale={locale} />
          </DataPanel>
        </>
      ) : null}

      {tab === 'services' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('service')}>
              {formCopy.registerService}
            </button>
          </div>
          <DataPanel title={copy.tabs.opsServices}>
            <DataTable rows={operational} columns={['flight_code', 'kind', 'provider', 'amount', 'currency', 'status']} locale={locale} />
          </DataPanel>
        </>
      ) : null}

      {tab === 'payments' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('payment')}>
              {formCopy.registerPayment}
            </button>
          </div>
          <DataPanel title={copy.tabs.opsPayments}>
            <p className="status">{formCopy.noGateway}</p>
            <DataTable
              rows={payments}
              columns={['flight_code', 'service_provider', 'expense_category', 'amount', 'currency', 'method', 'status', 'reference']}
              locale={locale}
            />
          </DataPanel>
        </>
      ) : null}

      {tab === 'documents' ? (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={() => open('expense')}>
              {formCopy.registerExpense}
            </button>
          </div>
          <DataPanel title={copy.sections.expenses}>
            <p className="status">{formCopy.ownExpense}</p>
            <DataTable
              rows={expenses}
              columns={['flight_code', 'category', 'description', 'amount', 'currency', 'status', 'author_email']}
              locale={locale}
            />
            <div className="actions">
              {expenses
                .filter((row) => row.status === 'submitted' && String(row.author_email).toLowerCase() !== actorEmail.toLowerCase())
                .map((row) => (
                  <button key={String(row.id)} type="button" className="ghost btn-compact" onClick={() => onApproveExpense(String(row.id))}>
                    {formCopy.approveExpense} · {String(row.category)}
                  </button>
                ))}
            </div>
          </DataPanel>
        </>
      ) : null}

      <Modal open={kind != null} title={title} closeLabel={copy.cancel} onClose={() => setKind(null)}>
        <form className="stack" onSubmit={submit}>
          {kind === 'payment' ? <p className="status">{formCopy.noGateway}</p> : null}
          {kind === 'expense' ? <p className="status">{formCopy.ownExpense}</p> : null}
          {kind === 'service' ? (
            <ChipRow
              label={formCopy.registerService}
              value={form.kind}
              options={[
                ['fuel', formCopy.kindFuel],
                ['handling', formCopy.kindHandling],
                ['catering', formCopy.kindCatering],
                ['transport', formCopy.kindTransport],
                ['hotac', formCopy.kindHotac],
                ['other', formCopy.kindOther],
              ]}
              onChange={(value) => setForm({ ...form, kind: value })}
            />
          ) : null}
          {kind === 'fee' || kind === 'service' ? (
            <>
              <label htmlFor="ops-provider">{formCopy.provider}</label>
              <Autocomplete
                id="ops-provider"
                allowCustom
                options={providers}
                values={form.provider ? [form.provider] : []}
                placeholder={formCopy.provider}
                emptyLabel={copy.empty}
                onChange={(values) => setForm({ ...form, provider: values[0] ?? '' })}
              />
            </>
          ) : null}
          {kind === 'fee' ? (
            <>
              <label htmlFor="ops-airport">{formCopy.airport}</label>
              <input id="ops-airport" value={form.airport} maxLength={4} onChange={(event) => setForm({ ...form, airport: event.target.value })} required />
            </>
          ) : null}
          {kind === 'expense' ? (
            <>
              <label htmlFor="ops-category">{formCopy.category}</label>
              <input id="ops-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
              <label htmlFor="ops-description">{formCopy.description}</label>
              <textarea id="ops-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </>
          ) : null}
          {kind === 'payment' ? (
            <>
              <ChipRow
                label={formCopy.source}
                value={form.source}
                options={[
                  ['service', formCopy.registerService],
                  ['expense', formCopy.registerExpense],
                ]}
                onChange={(value) => setForm({ ...form, source: value as 'service' | 'expense', sourceId: '', currency: 'USD', amount: '' })}
              />
              <label htmlFor="ops-source">{formCopy.source}</label>
              <Autocomplete
                id="ops-source"
                options={obligations}
                values={form.sourceId ? [form.sourceId] : []}
                placeholder={formCopy.source}
                emptyLabel={copy.empty}
                onChange={(values) => {
                  const sourceId = values[0] ?? '';
                  const row = (form.source === 'service' ? services : expenses).find((item) => String(item.id) === sourceId);
                  setForm({
                    ...form,
                    sourceId,
                    currency: row ? String(row.currency) : form.currency,
                    amount: row ? String(row.amount) : '',
                  });
                }}
              />
              <ChipRow
                label={formCopy.method}
                value={form.method}
                options={[
                  ['transfer', formCopy.methodTransfer],
                  ['cash', formCopy.methodCash],
                  ['card', formCopy.methodCard],
                  ['other', formCopy.methodOther],
                ]}
                onChange={(value) => setForm({ ...form, method: value })}
              />
              <label htmlFor="ops-reference">{formCopy.reference}</label>
              <input id="ops-reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
              <ChipRow
                label={formCopy.paymentRecorded}
                value={form.paymentStatus}
                options={[
                  ['recorded', formCopy.paymentRecorded],
                  ['confirmed', formCopy.paymentConfirmed],
                ]}
                onChange={(value) => setForm({ ...form, paymentStatus: value })}
              />
            </>
          ) : null}
          {kind !== 'payment' ? (
            <>
              <label htmlFor="ops-flight">{formCopy.flight}</label>
              <Autocomplete
                id="ops-flight"
                options={flightOptions}
                values={form.flightId ? [form.flightId] : []}
                placeholder={formCopy.flight}
                emptyLabel={copy.empty}
                onChange={(values) => setForm({ ...form, flightId: values[0] ?? '' })}
              />
            </>
          ) : null}
          <label htmlFor="ops-amount">{formCopy.amount}</label>
          <input id="ops-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          {kind === 'payment' ? null : (
            <ChipRow
              label={formCopy.currency}
              value={form.currency}
              options={[
                ['USD', 'USD'],
                ['EUR', 'EUR'],
                ['VES', 'VES'],
              ]}
              onChange={(value) => setForm({ ...form, currency: value })}
            />
          )}
          {kind === 'fee' || kind === 'service' ? (
            <ChipRow
              label={copy.flightsForm.status}
              value={form.status}
              options={[
                ['requested', formCopy.statusRequested],
                ['quoted', formCopy.statusQuoted],
                ['confirmed', formCopy.statusConfirmed],
                ['received', formCopy.statusReceived],
                ['cancelled', formCopy.statusCancelled],
              ]}
              onChange={(value) => setForm({ ...form, status: value })}
            />
          ) : null}
          {kind === 'expense' ? (
            <ChipRow
              label={copy.flightsForm.status}
              value={form.expenseStatus}
              options={[
                ['draft', formCopy.expenseDraft],
                ['submitted', formCopy.expenseSubmitted],
              ]}
              onChange={(value) => setForm({ ...form, expenseStatus: value })}
            />
          ) : null}
          {kind === 'fee' || kind === 'payment' ? (
            <>
              <label htmlFor="ops-url">{formCopy.officialUrl}</label>
              <input id="ops-url" type="url" value={form.officialUrl} onChange={(event) => setForm({ ...form, officialUrl: event.target.value })} />
            </>
          ) : null}
          <div className="actions">
            <button
              type="submit"
              disabled={
                ((kind === 'fee' || kind === 'service') && !form.provider) ||
                (kind === 'payment' && !form.sourceId)
              }
            >
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

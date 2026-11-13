import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  canRead: boolean;
  onSubmit: (body: { title: string; narrative: string; anonymous: boolean; severity: string }) => Promise<boolean>;
  onStatus: (id: string, status: string) => Promise<boolean>;
};

const empty = () => ({ title: '', narrative: '', anonymous: false, severity: 'medium' });

export function SmsPage({ locale, rows, canRead, onSubmit, onStatus }: Props) {
  const copy = t(locale);
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => String(row.id) === selectedId) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSubmit(form);
    if (ok) {
      setForm(empty());
      setReportOpen(false);
    }
  }

  return (
    <div className="module-page">
      <ModuleHero title={copy.modules.sms} subtitle={copy.moduleSubs.sms} image="/heroes/hero-sms.png" />

      <div className="module-toolbar">
        <button
          type="button"
          onClick={() => {
            setForm(empty());
            setReportOpen(true);
          }}
        >
          {copy.sms.newReport}
        </button>
      </div>

      <Modal open={reportOpen} title={copy.sms.newReport} closeLabel={copy.cancel} onClose={() => setReportOpen(false)}>
        <form className="stack" onSubmit={handleSubmit}>
          <p className="status">{copy.sms.noAuthority}</p>
          <label htmlFor="sms-title">{copy.sms.titleLabel}</label>
          <input id="sms-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <label htmlFor="sms-body">{copy.sms.narrative}</label>
          <textarea id="sms-body" rows={4} value={form.narrative} onChange={(event) => setForm({ ...form, narrative: event.target.value })} required />
          <span>{copy.columns.severity}</span>
          <div className="magic-filters" role="group" aria-label={copy.columns.severity}>
            {(
              [
                ['low', copy.sms.severityLow],
                ['medium', copy.sms.severityMedium],
                ['high', copy.sms.severityHigh],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`magic-chip${form.severity === value ? ' is-on' : ''}`}
                onClick={() => setForm({ ...form, severity: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(event) => setForm({ ...form, anonymous: event.target.checked })}
            />{' '}
            {copy.sms.anonymous}
          </label>
          <div className="actions">
            <button type="submit">{copy.sms.send}</button>
            <button type="button" className="ghost" onClick={() => setReportOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      {canRead ? (
        <DataPanel title={copy.sms.reserved}>
          <DataTable
            rows={rows}
            columns={['title', 'severity', 'status', 'anonymous', 'reporter_email']}
            locale={locale}
            searchOmitKeys={['narrative', 'reporter_email']}
            onOpen={(id) => setSelectedId(id)}
          />
          {selected ? (
            <section className="stack">
              <h3>{String(selected.title ?? '')}</h3>
              <p>{String(selected.narrative ?? '')}</p>
              <div className="magic-filters" role="group" aria-label={copy.flightsForm.status}>
                {(
                  [
                    ['open', copy.sms.statusOpen],
                    ['in_review', copy.sms.statusReview],
                    ['closed', copy.sms.statusClosed],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`magic-chip${selected.status === value ? ' is-on' : ''}`}
                    onClick={() => onStatus(String(selected.id), value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </DataPanel>
      ) : (
        <p className="status">{copy.sms.reserved}</p>
      )}
    </div>
  );
}

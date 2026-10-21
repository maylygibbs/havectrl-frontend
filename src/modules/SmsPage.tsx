import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  canRead: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
};

export function SmsPage({ locale, rows, canRead, onSubmit }: Props) {
  const copy = t(locale);
  const [reportOpen, setReportOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSubmit(event);
    if (ok) setReportOpen(false);
  }

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.sms}
        subtitle={copy.moduleSubs.sms}
        image="/heroes/hero-sms.png"
      />

      <div className="module-toolbar">
        <button type="button" onClick={() => setReportOpen(true)}>
          {copy.sms.newReport}
        </button>
      </div>

      <Modal
        open={reportOpen}
        title={copy.sms.newReport}
        closeLabel={copy.cancel}
        onClose={() => setReportOpen(false)}
      >
        <form className="stack" onSubmit={handleSubmit}>
          <label htmlFor="sms-title">{copy.sms.titleLabel}</label>
          <input id="sms-title" name="title" required />
          <label htmlFor="sms-body">{copy.sms.narrative}</label>
          <textarea id="sms-body" name="narrative" required rows={4} />
          <label className="check">
            <input name="anonymous" type="checkbox" /> {copy.sms.anonymous}
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
        <DataPanel title={copy.modules.sms}>
          <DataTable
            rows={rows}
            columns={['title', 'severity', 'status', 'anonymous', 'reporter_email']}
            locale={locale}
          />
        </DataPanel>
      ) : (
        <p className="status">{copy.sms.reserved}</p>
      )}
    </div>
  );
}

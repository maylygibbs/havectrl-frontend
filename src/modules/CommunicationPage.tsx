import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  onCreate: (body: Record<string, unknown>) => Promise<boolean>;
  onMinutes: (id: string, body: Record<string, unknown>) => Promise<boolean>;
};

const emptyMeeting = () => ({ title: '', startsAt: '', agenda: '', status: 'scheduled', locationUrl: '' });

export function CommunicationPage({ locale, rows, onCreate, onMinutes }: Props) {
  const copy = t(locale);
  const formCopy = copy.communicationForm;
  const [tab, setTab] = useState<'meetings' | 'minutes'>('meetings');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyMeeting());
  const [meetingId, setMeetingId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [minutesStatus, setMinutesStatus] = useState('draft');
  const options = rows.map((row) => ({ value: String(row.id), label: String(row.title ?? '') }));

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const when = new Date(form.startsAt);
    if (Number.isNaN(when.getTime())) return;
    const ok = await onCreate({
      title: form.title,
      startsAt: when.toISOString(),
      agenda: form.agenda,
      status: form.status,
      locationUrl: form.locationUrl || null,
    });
    if (ok) {
      setForm(emptyMeeting());
      setOpen(false);
    }
  }

  async function submitMinutes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meetingId) return;
    const ok = await onMinutes(meetingId, { minutes, minutesStatus });
    if (ok) {
      setMeetingId('');
      setMinutes('');
      setMinutesStatus('draft');
    }
  }

  return (
    <div className="module-page">
      <ModuleHero title={copy.modules.communication} subtitle={copy.moduleSubs.communication} image="/heroes/hero-communication.png" />
      <ModuleTabs
        tabs={[
          { id: 'meetings', label: copy.tabs.commMeetings },
          { id: 'minutes', label: copy.tabs.commMinutes },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      <p className="status">{formCopy.effect}</p>

      {tab === 'meetings' ? (
        <>
          <div className="module-toolbar">
            <button
              type="button"
              onClick={() => {
                setForm(emptyMeeting());
                setOpen(true);
              }}
            >
              {formCopy.newMeeting}
            </button>
          </div>
          <DataPanel title={copy.tabs.commMeetings}>
            <DataTable rows={rows} columns={['title', 'starts_at', 'agenda', 'status', 'minutes_status']} locale={locale} />
          </DataPanel>
        </>
      ) : (
        <DataPanel title={copy.tabs.commMinutes}>
          <form className="stack" onSubmit={submitMinutes}>
            <label htmlFor="minutes-meeting">{formCopy.newMeeting}</label>
            <Autocomplete
              id="minutes-meeting"
              options={options}
              values={meetingId ? [meetingId] : []}
              placeholder={formCopy.newMeeting}
              emptyLabel={copy.empty}
              onChange={(values) => {
                const id = values[0] ?? '';
                const row = rows.find((item) => String(item.id) === id);
                setMeetingId(id);
                setMinutes(row ? String(row.minutes ?? '') : '');
                setMinutesStatus(row ? String(row.minutes_status ?? 'draft') : 'draft');
              }}
            />
            <label htmlFor="minutes-body">{formCopy.minutes}</label>
            <textarea id="minutes-body" rows={5} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
            <div className="magic-filters" role="group" aria-label={formCopy.minutes}>
              {(
                [
                  ['draft', formCopy.minutesDraft],
                  ['recorded', formCopy.minutesRecorded],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`magic-chip${minutesStatus === value ? ' is-on' : ''}`}
                  onClick={() => setMinutesStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="actions">
              <button type="submit" disabled={!meetingId || (minutesStatus === 'recorded' && !minutes.trim())}>
                {formCopy.writeMinutes}
              </button>
            </div>
          </form>
        </DataPanel>
      )}

      <Modal open={open} title={formCopy.newMeeting} closeLabel={copy.cancel} onClose={() => setOpen(false)}>
        <form className="stack" onSubmit={submitMeeting}>
          <p className="status">{formCopy.effect}</p>
          <label htmlFor="meeting-title">{copy.sms.titleLabel}</label>
          <input id="meeting-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <label htmlFor="meeting-when">{formCopy.when}</label>
          <input id="meeting-when" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} required />
          <label htmlFor="meeting-agenda">{formCopy.agenda}</label>
          <textarea id="meeting-agenda" rows={4} value={form.agenda} onChange={(event) => setForm({ ...form, agenda: event.target.value })} required />
          <label htmlFor="meeting-link">{formCopy.link}</label>
          <input id="meeting-link" type="url" value={form.locationUrl} onChange={(event) => setForm({ ...form, locationUrl: event.target.value })} />
          <div className="magic-filters" role="group" aria-label={copy.flightsForm.status}>
            {(
              [
                ['draft', formCopy.statusDraft],
                ['scheduled', formCopy.statusScheduled],
                ['cancelled', formCopy.statusCancelled],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`magic-chip${form.status === value ? ' is-on' : ''}`}
                onClick={() => setForm({ ...form, status: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="submit">{formCopy.newMeeting}</button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

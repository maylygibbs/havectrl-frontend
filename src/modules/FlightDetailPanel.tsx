import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Modal } from '../ui/Modal';
import { DataTable, DetailPanel } from '../ui/table';

export type FlightLogForm = {
  blockMinutes: string;
  flightMinutes: string;
  cycles: string;
  pilotName: string;
  reviewStatus: string;
  notes: string;
  crewWorkerId: string;
  functionCode: string;
};

type Props = {
  locale: Locale;
  detail: Record<string, unknown>;
  onAddLeg: (flightId: string, body: { origin: string; destination: string; eet: string }) => Promise<boolean>;
  onDeleteLeg: (legId: string) => Promise<boolean>;
  onSaveLog: (flightId: string, form: FlightLogForm) => Promise<boolean>;
  crewOptions: { id: string; full_name: string }[];
};

export function FlightDetailPanel({ locale, detail, onAddLeg, onDeleteLeg, onSaveLog, crewOptions }: Props) {
  const copy = t(locale);
  const flightId = String(detail.id);
  const legs = (detail.legs as Record<string, unknown>[]) ?? [];
  const [legOpen, setLegOpen] = useState(false);
  const [legOrigin, setLegOrigin] = useState('');
  const [legDestination, setLegDestination] = useState('');
  const [legEet, setLegEet] = useState('');
  const [logForm, setLogForm] = useState<FlightLogForm>(emptyLogForm());

  useEffect(() => {
    const log = detail.log as Record<string, unknown> | null | undefined;
    setLogForm({
      blockMinutes: String(log?.block_minutes ?? ''),
      flightMinutes: String(log?.flight_minutes ?? ''),
      cycles: String(log?.cycles ?? ''),
      pilotName: String(log?.pilot_name ?? ''),
      reviewStatus: String(log?.review_status ?? 'pending'),
      notes: String(log?.notes ?? ''),
      crewWorkerId: '',
      functionCode: 'PIC',
    });
  }, [detail.id, detail.log]);

  const panelData = useMemo(() => {
    const { legs: _legs, ...rest } = detail;
    return rest;
  }, [detail]);

  async function submitLeg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onAddLeg(flightId, {
      origin: legOrigin,
      destination: legDestination,
      eet: legEet,
    });
    if (ok) {
      setLegOpen(false);
      setLegOrigin('');
      setLegDestination('');
      setLegEet('');
    }
  }

  async function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSaveLog(flightId, logForm);
  }

  return (
    <div className="stack">
      <DetailPanel data={panelData} locale={locale} showTitle={false} />

      <section>
        <header className="panel-head">
          <h3>{copy.flightsForm.legs}</h3>
          <button type="button" className="btn-compact" onClick={() => setLegOpen(true)}>
            {copy.flightsForm.addLeg}
          </button>
        </header>
        <DataTable
          rows={legs}
          columns={['sequence', 'origin', 'destination', 'eet']}
          locale={locale}
          searchable={false}
        />
        {legs.length > 0 ? (
          <div className="actions">
            {legs.map((leg) => (
              <button
                key={String(leg.id)}
                type="button"
                className="ghost danger btn-compact"
                onClick={() => onDeleteLeg(String(leg.id))}
              >
                {copy.softDelete} #{String(leg.sequence)}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h3>{copy.tabs.dailyLog}</h3>
        <form className="stack" onSubmit={submitLog}>
          <label htmlFor="log-block">{copy.flightsForm.blockMinutes}</label>
          <input
            id="log-block"
            type="number"
            min={0}
            value={logForm.blockMinutes}
            onChange={(e) => setLogForm({ ...logForm, blockMinutes: e.target.value })}
            required
          />
          <label htmlFor="log-flight-min">{copy.flightsForm.flightMinutes}</label>
          <input
            id="log-flight-min"
            type="number"
            min={0}
            value={logForm.flightMinutes}
            onChange={(e) => setLogForm({ ...logForm, flightMinutes: e.target.value })}
            required
          />
          <label htmlFor="log-cycles">{copy.flightsForm.cycles}</label>
          <input
            id="log-cycles"
            type="number"
            min={0}
            value={logForm.cycles}
            onChange={(e) => setLogForm({ ...logForm, cycles: e.target.value })}
            required
          />
          <label htmlFor="log-pilot">{copy.flightsForm.pilotName}</label>
          <input
            id="log-pilot"
            value={logForm.pilotName}
            onChange={(e) => setLogForm({ ...logForm, pilotName: e.target.value })}
            required
          />
          <label htmlFor="log-crew">{copy.crew.fullName}</label>
          <select
            id="log-crew"
            value={logForm.crewWorkerId}
            onChange={(e) => setLogForm({ ...logForm, crewWorkerId: e.target.value })}
          >
            <option value="">{copy.crew.selectWorker}</option>
            {crewOptions.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.full_name}
              </option>
            ))}
          </select>
          <label htmlFor="log-function">{copy.crew.position}</label>
          <select
            id="log-function"
            value={logForm.functionCode}
            onChange={(e) => setLogForm({ ...logForm, functionCode: e.target.value })}
          >
            {['PIC', 'SIC', 'CABIN', 'TECH', 'DISP', 'PAX', 'SIM'].map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <label htmlFor="log-review">{copy.flightsForm.reviewStatus}</label>
          <input
            id="log-review"
            value={logForm.reviewStatus}
            onChange={(e) => setLogForm({ ...logForm, reviewStatus: e.target.value })}
          />
          <label htmlFor="log-notes">{copy.crew.notes}</label>
          <textarea
            id="log-notes"
            rows={3}
            value={logForm.notes}
            onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
          />
          <div className="actions">
            <button type="submit">{copy.flightsForm.saveLog}</button>
          </div>
        </form>
      </section>

      <Modal open={legOpen} title={copy.flightsForm.addLeg} closeLabel={copy.cancel} onClose={() => setLegOpen(false)}>
        <form className="stack" onSubmit={submitLeg}>
          <label htmlFor="leg-origin">{copy.flightsForm.origin}</label>
          <input
            id="leg-origin"
            value={legOrigin}
            onChange={(e) => setLegOrigin(e.target.value)}
            maxLength={4}
            required
          />
          <label htmlFor="leg-dest">{copy.flightsForm.destination}</label>
          <input
            id="leg-dest"
            value={legDestination}
            onChange={(e) => setLegDestination(e.target.value)}
            maxLength={4}
            required
          />
          <label htmlFor="leg-eet">{copy.flightsForm.eet}</label>
          <input id="leg-eet" value={legEet} onChange={(e) => setLegEet(e.target.value)} placeholder="0100" />
          <div className="actions">
            <button type="submit">{copy.create}</button>
            <button type="button" className="ghost" onClick={() => setLegOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function emptyLogForm(): FlightLogForm {
  return {
    blockMinutes: '',
    flightMinutes: '',
    cycles: '',
    pilotName: '',
    reviewStatus: 'pending',
    crewWorkerId: '',
    functionCode: 'PIC',
    notes: '',
  };
}

import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { FlightDetailPanel } from './FlightDetailPanel';
import { cellText, DataTable } from '../ui/table';

export type FlightForm = {
  code: string;
  aircraftId: string;
  flightDate: string;
  origin: string;
  destination: string;
  eobt: string;
  status: string;
};

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  detail: Record<string, unknown> | null;
  aircraftOptions: Record<string, unknown>[];
  flightForm: FlightForm;
  showFlightForm: boolean;
  onOpen: (id: string) => void;
  onCloseDetail: () => void;
  onStartCreateFlight: () => void;
  onFlightFormChange: (form: FlightForm) => void;
  onShowFlightForm: (show: boolean) => void;
  onSubmitFlight: (event: FormEvent<HTMLFormElement>) => void;
  onAddLeg: (flightId: string, body: { origin: string; destination: string; eet: string }) => Promise<boolean>;
  onDeleteLeg: (legId: string) => Promise<boolean>;
  onSaveFlightLog: (
    flightId: string,
    form: {
      blockMinutes: string;
      flightMinutes: string;
      cycles: string;
      pilotName: string;
      reviewStatus: string;
      notes: string;
    },
  ) => Promise<boolean>;
};

export function FlightsPage({
  locale,
  rows,
  detail,
  aircraftOptions,
  flightForm,
  showFlightForm,
  onOpen,
  onCloseDetail,
  onStartCreateFlight,
  onFlightFormChange,
  onShowFlightForm,
  onSubmitFlight,
  onAddLeg,
  onDeleteLeg,
  onSaveFlightLog,
}: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<
    'planning' | 'plan' | 'log' | 'wb' | 'tracking' | 'weather' | 'converter'
  >('planning');

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.flights}
        subtitle={copy.moduleSubs.flights}
        image="/heroes/hero-flights.png"
        meta="Beechcraft 1900D | YV3500"
      />
      <ModuleTabs
        tabs={[
          { id: 'planning', label: copy.tabs.flightPlanning },
          { id: 'plan', label: copy.tabs.flightPlan },
          { id: 'log', label: copy.tabs.dailyLog },
          { id: 'wb', label: copy.tabs.weightBalance },
          { id: 'tracking', label: copy.tabs.flightTracking },
          { id: 'weather', label: copy.tabs.weatherNotams },
          { id: 'converter', label: copy.tabs.unitConverter },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      <Modal
        open={showFlightForm}
        title={copy.flightsForm.newFlight}
        closeLabel={copy.cancel}
        onClose={() => onShowFlightForm(false)}
      >
        <form className="stack" onSubmit={onSubmitFlight}>
          <label htmlFor="flight-code">{copy.flightsForm.code}</label>
          <input
            id="flight-code"
            value={flightForm.code}
            onChange={(e) => onFlightFormChange({ ...flightForm, code: e.target.value })}
            required
          />
          <label htmlFor="flight-aircraft">{copy.flightsForm.aircraft}</label>
          <select
            id="flight-aircraft"
            value={flightForm.aircraftId}
            onChange={(e) => onFlightFormChange({ ...flightForm, aircraftId: e.target.value })}
            required
          >
            <option value="">—</option>
            {aircraftOptions.map((ac) => (
              <option key={String(ac.id)} value={String(ac.id)}>
                {String(ac.registration)} · {String(ac.model)}
              </option>
            ))}
          </select>
          <label htmlFor="flight-date">{copy.flightsForm.flightDate}</label>
          <input
            id="flight-date"
            type="date"
            value={flightForm.flightDate}
            onChange={(e) => onFlightFormChange({ ...flightForm, flightDate: e.target.value })}
            required
          />
          <label htmlFor="flight-origin">{copy.flightsForm.origin}</label>
          <input
            id="flight-origin"
            value={flightForm.origin}
            onChange={(e) => onFlightFormChange({ ...flightForm, origin: e.target.value })}
            required
            maxLength={4}
          />
          <label htmlFor="flight-destination">{copy.flightsForm.destination}</label>
          <input
            id="flight-destination"
            value={flightForm.destination}
            onChange={(e) => onFlightFormChange({ ...flightForm, destination: e.target.value })}
            required
            maxLength={4}
          />
          <label htmlFor="flight-eobt">{copy.flightsForm.eobt}</label>
          <input
            id="flight-eobt"
            value={flightForm.eobt}
            onChange={(e) => onFlightFormChange({ ...flightForm, eobt: e.target.value })}
            placeholder="0800"
          />
          <label htmlFor="flight-status">{copy.flightsForm.status}</label>
          <input
            id="flight-status"
            value={flightForm.status}
            onChange={(e) => onFlightFormChange({ ...flightForm, status: e.target.value })}
          />
          <div className="actions">
            <button type="submit">{copy.create}</button>
            <button type="button" className="ghost" onClick={() => onShowFlightForm(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detail != null}
        title={
          detail
            ? `${copy.sections.detail} · ${cellText(detail.code)}`
            : copy.sections.detail
        }
        closeLabel={copy.cancel}
        onClose={onCloseDetail}
      >
        {detail ? (
          <FlightDetailPanel
            locale={locale}
            detail={detail}
            onAddLeg={onAddLeg}
            onDeleteLeg={onDeleteLeg}
            onSaveLog={onSaveFlightLog}
          />
        ) : null}
      </Modal>

      {tab === 'planning' && (
        <>
          <div className="module-toolbar">
            <button type="button" onClick={onStartCreateFlight}>
              {copy.flightsForm.newFlight}
            </button>
          </div>
          <DataPanel title={copy.tabs.flightPlanning}>
            <DataTable
              rows={rows}
              columns={['code', 'registration', 'origin', 'destination', 'status', 'fpl_status', 'review_status']}
              locale={locale}
              onOpen={onOpen}
            />
          </DataPanel>
        </>
      )}

      {tab === 'tracking' ? (
        <DataPanel title={copy.tabs.flightTracking}>
          <p className="status">{copy.moduleSubs.iteration2Unavailable}</p>
        </DataPanel>
      ) : null}

      {tab === 'plan' && (
        <DataPanel title={copy.tabs.flightPlan}>
          <DataTable
            rows={rows}
            columns={['code', 'origin', 'destination', 'fpl_status', 'status']}
            locale={locale}
            onOpen={onOpen}
          />
        </DataPanel>
      )}

      {tab === 'log' && (
        <DataPanel title={copy.tabs.dailyLog}>
          <DataTable
            rows={rows}
            columns={['code', 'registration', 'origin', 'destination', 'review_status', 'status']}
            locale={locale}
            onOpen={onOpen}
          />
        </DataPanel>
      )}

      {tab === 'wb' ? (
        <DataPanel title={copy.tabs.weightBalance}>
          <p className="status">{copy.moduleSubs.comingSoon}</p>
        </DataPanel>
      ) : null}
      {tab === 'weather' ? (
        <DataPanel title={copy.tabs.weatherNotams}>
          <p className="status">{copy.moduleSubs.iteration2Unavailable}</p>
        </DataPanel>
      ) : null}
      {tab === 'converter' ? (
        <DataPanel title={copy.tabs.unitConverter}>
          <p className="status">{copy.moduleSubs.iteration2Unavailable}</p>
        </DataPanel>
      ) : null}
    </div>
  );
}

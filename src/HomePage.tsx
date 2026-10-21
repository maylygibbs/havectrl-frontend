import { useMemo, useState } from 'react';
import { Locale, t } from './i18n/catalog';
import { TableSearchBar } from './ui/TableSearchBar';

export type HomeData = {
  counts: {
    crew?: number | null;
    aircraft?: number | null;
    flightsToday?: number | null;
    serviceRequests?: number | null;
    maintenanceDue?: number | null;
    communication?: number | null;
    openSmsReports?: number | null;
  };
  flights: {
    code: string;
    origin: string;
    destination: string;
    status: string;
    eobt?: string;
    flight_date?: string;
    registration?: string;
  }[];
  aircraft: { registration: string; model: string; technical_status: string }[];
  fleet: {
    total: number;
    inService: number;
    inMaintenance: number;
    onGround: number;
  };
  activity: { at: string; kind: string; text: string }[];
  systemStatus: { level: string; message: string };
};

type Props = {
  data: HomeData;
  locale: Locale;
  brandingName?: string;
  onOpenModule: (id: 'crew' | 'aircraft' | 'flights' | 'operations' | 'maintenance' | 'communication' | 'sms') => void;
};

export function HomePage({ data, locale, brandingName, onOpenModule }: Props) {
  const copy = t(locale);
  const [flightSearch, setFlightSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const flightsVisible = useMemo(() => {
    const q = flightSearch.trim().toLowerCase();
    if (!q) return data.flights;
    return data.flights.filter((flight) =>
      [flight.code, flight.origin, flight.destination, flight.status, flight.eobt, flight.registration]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [data.flights, flightSearch]);
  const activityVisible = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    if (!q) return data.activity;
    return data.activity.filter((item) => `${item.kind} ${item.text}`.toLowerCase().includes(q));
  }, [data.activity, activitySearch]);
  const cards = [
    data.counts.crew != null
      ? { key: 'crew' as const, label: copy.home.cardCrew, value: data.counts.crew, hint: copy.home.cardCrewHint }
      : null,
    data.counts.aircraft != null
      ? {
          key: 'aircraft' as const,
          label: copy.home.cardAircraft,
          value: data.counts.aircraft,
          hint: copy.home.cardAircraftHint,
        }
      : null,
    data.counts.flightsToday != null
      ? {
          key: 'flights' as const,
          label: copy.home.cardFlights,
          value: data.counts.flightsToday,
          hint: copy.home.cardFlightsHint,
        }
      : null,
    data.counts.serviceRequests != null
      ? {
          key: 'operations' as const,
          label: copy.home.cardServices,
          value: data.counts.serviceRequests,
          hint: copy.home.cardServicesHint,
        }
      : null,
    data.counts.maintenanceDue != null
      ? {
          key: 'maintenance' as const,
          label: copy.home.cardMaintenance,
          value: data.counts.maintenanceDue,
          hint: copy.home.cardMaintenanceHint,
        }
      : null,
    data.counts.communication != null
      ? {
          key: 'communication' as const,
          label: copy.home.cardCommunication,
          value: data.counts.communication,
          hint: copy.home.cardCommunicationHint,
        }
      : null,
  ].filter(Boolean) as {
    key: 'crew' | 'aircraft' | 'flights' | 'operations' | 'maintenance' | 'communication';
    label: string;
    value: number;
    hint: string;
  }[];

  return (
    <div className="home">
      <section className="hero" aria-label="HAVECTRL">
        <img className="hero-photo" src="/heroes/hero-home.png" alt="" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-brand">HAVECTRL</p>
          <h1 className="hero-title">{copy.home.heroTitle}</h1>
          <p className="hero-sub">{copy.home.heroSub}</p>
          <div className="hero-progress" aria-hidden="true" />
          {brandingName ? <p className="hero-tenant">{brandingName}</p> : null}
        </div>
        <div className="hero-meta" aria-hidden="true">
          <span>Beechcraft 1900D | YV3500 | SVMI</span>
        </div>
      </section>

      <section className="metric-grid" aria-label={copy.home.overview}>
        {cards.map((card) => (
          <button key={card.key} type="button" className="metric-card" onClick={() => onOpenModule(card.key)}>
            <span className="metric-label">{card.label}</span>
            <strong className="metric-value">{card.value}</strong>
            <span className="metric-hint">{card.hint}</span>
          </button>
        ))}
      </section>

      <div className="home-grid">
        <section className="panel-light">
          <header className="panel-head">
            <h2>{copy.home.todaysFlights}</h2>
          </header>
          {data.flights.length === 0 ? (
            <p className="status">{copy.empty}</p>
          ) : (
            <div className="table-stack">
              <TableSearchBar locale={locale} value={flightSearch} onChange={setFlightSearch} />
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{copy.home.colTime}</th>
                    <th>{copy.home.colFlight}</th>
                    <th>{copy.home.colRoute}</th>
                    <th>{copy.home.colAircraft}</th>
                    <th>{copy.home.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {flightsVisible.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="status">{copy.empty}</p>
                      </td>
                    </tr>
                  ) : (
                  flightsVisible.map((flight) => (
                    <tr key={flight.code}>
                      <td>{flight.eobt || '?'}</td>
                      <td>{flight.code}</td>
                      <td>
                        {flight.origin} ? {flight.destination}
                      </td>
                      <td>{flight.registration || '?'}</td>
                      <td>
                        <StatusPill status={flight.status} />
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </section>

        <aside className="home-side">
          <section className="panel-light">
            <header className="panel-head">
              <h2>{copy.home.fleetOverview}</h2>
            </header>
            <FleetDonut fleet={data.fleet} locale={locale} />
          </section>

          <section className="panel-light">
            <header className="panel-head">
              <h2>{copy.home.recentActivity}</h2>
            </header>
            {data.activity.length === 0 ? (
              <p className="status">{copy.empty}</p>
            ) : (
              <>
                <TableSearchBar locale={locale} value={activitySearch} onChange={setActivitySearch} />
                {activityVisible.length === 0 ? (
                  <p className="status">{copy.empty}</p>
                ) : (
              <ul className="activity-list">
                {activityVisible.map((item, index) => (
                  <li key={`${item.kind}-${index}`}>
                    <span className="activity-dot" data-kind={item.kind} />
                    <div>
                      <p>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
                )}
              </>
            )}
          </section>
        </aside>
      </div>

      <footer className="system-bar" data-level={data.systemStatus.level}>
        <span className="system-shield" aria-hidden="true" />
        <p>{locale === 'es' ? copy.home.systemOkEs : data.systemStatus.message}</p>
      </footer>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'arrived' || status === 'on_time'
      ? 'ok'
      : status === 'assigned' || status === 'boarding'
        ? 'info'
        : status === 'planned' || status === 'scheduled'
          ? 'muted'
          : 'warn';
  return <span className={`pill pill-${tone}`}>{status.replaceAll('_', ' ')}</span>;
}

function FleetDonut({
  fleet,
  locale,
}: {
  fleet: HomeData['fleet'];
  locale: Locale;
}) {
  const copy = t(locale);
  const total = Math.max(fleet.total, 1);
  const a = (fleet.inService / total) * 100;
  const b = (fleet.inMaintenance / total) * 100;
  const c = (fleet.onGround / total) * 100;
  const gradient = `conic-gradient(
    #22c55e 0 ${a}%,
    #eab308 ${a}% ${a + b}%,
    #94a3b8 ${a + b}% ${a + b + c}%,
    #e2e8f0 ${a + b + c}% 100%
  )`;

  return (
    <div className="fleet">
      <div className="donut" style={{ background: gradient }} aria-hidden="true">
        <div className="donut-hole">
          <strong>{fleet.total}</strong>
          <span>{copy.home.fleetTotal}</span>
        </div>
      </div>
      <ul className="fleet-legend">
        <li>
          <span className="swatch ok" /> {copy.home.inService} ? {fleet.inService}
        </li>
        <li>
          <span className="swatch warn" /> {copy.home.inMaintenance} ? {fleet.inMaintenance}
        </li>
        <li>
          <span className="swatch muted" /> {copy.home.onGround} ? {fleet.onGround}
        </li>
      </ul>
    </div>
  );
}

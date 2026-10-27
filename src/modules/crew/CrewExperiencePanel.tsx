import { Locale, t } from '../../i18n/catalog';
import { DataPanel } from '../../ui/ModuleChrome';
import { cellText } from '../../ui/table';

type Report = {
  flightMinutes: number;
  blockMinutes: number;
  creditedMinutes: number;
  nightMinutes: number;
  instrumentMinutes: number;
  simulatorMinutes: number;
  partialHistory: boolean;
  windows: { months: number; flightMinutes: number; simulatorMinutes: number }[];
};

type Props = {
  locale: Locale;
  detail: Record<string, unknown> | null;
  onExport: (kind: 'profile' | 'schedule' | 'experience') => void;
  onAddPrevious: (origin: string, minutes: string, asOf: string) => void;
};

function minutes(value: number) {
  return `${value} min`;
}

export function CrewExperiencePanel({ locale, detail, onExport, onAddPrevious }: Props) {
  const copy = t(locale);
  if (!detail) {
    return <p className="status">{copy.crew.selectWorker}</p>;
  }
  const report = (detail.experienceReport as Report | undefined) ?? {
    flightMinutes: 0,
    blockMinutes: 0,
    creditedMinutes: 0,
    nightMinutes: 0,
    instrumentMinutes: 0,
    simulatorMinutes: 0,
    partialHistory: false,
    windows: [],
  };
  const previous = (detail.previousExperience as Record<string, unknown>[] | undefined) ?? [];
  const windowLabel = (months: number) =>
    months === 12 ? copy.crew.window12 : months === 6 ? copy.crew.window6 : copy.crew.window3;

  return (
    <div className="crew-experience-panel">
      <header className="crew-experience-summary panel-light">
        <div>
          <p className="muted-label">{copy.crew.flightMinutes}</p>
          <p className="crew-exp-total">{minutes(report.flightMinutes)}</p>
        </div>
        <div>
          <p className="muted-label">{copy.crew.blockMinutes}</p>
          <p>{minutes(report.blockMinutes)}</p>
        </div>
        <div>
          <p className="muted-label">{copy.crew.creditedMinutes}</p>
          <p>{minutes(report.creditedMinutes)}</p>
        </div>
        <div>
          <p className="muted-label">{copy.crew.simulatorMinutes}</p>
          <p>{minutes(report.simulatorMinutes)}</p>
        </div>
      </header>
      <div className="actions">
        <button type="button" className="ghost btn-compact" onClick={() => onExport('experience')}>
          {copy.crew.exportPdf}
        </button>
      </div>
      {report.partialHistory ? <p className="status">{copy.crew.partialHistory}</p> : null}
      <DataPanel title={`${copy.tabs.crewExperience} · ${cellText(detail.full_name)}`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{copy.crew.experienceNote}</th>
                <th>{copy.crew.flightMinutes}</th>
                <th>{copy.crew.simulatorMinutes}</th>
              </tr>
            </thead>
            <tbody>
              {report.windows.map((row) => (
                <tr key={row.months}>
                  <td>{windowLabel(row.months)}</td>
                  <td>{minutes(row.flightMinutes)}</td>
                  <td>{minutes(row.simulatorMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataPanel>
      <DataPanel title={copy.crew.previousExperience}>
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            onAddPrevious(String(data.get('origin') ?? ''), String(data.get('minutes') ?? ''), String(data.get('asOf') ?? ''));
            form.reset();
          }}
        >
          <label>
            {copy.crew.issuer}
            <input name="origin" required />
          </label>
          <label>
            {copy.crew.flightMinutes}
            <input name="minutes" type="number" min="0" required />
          </label>
          <label>
            {copy.crew.effectiveOn}
            <input name="asOf" type="date" />
          </label>
          <button type="submit">{copy.crew.addDocument}</button>
        </form>
        {previous.length === 0 ? (
          <p className="status">{copy.empty}</p>
        ) : (
          <ul>
            {previous.map((row) => (
              <li key={String(row.id)}>
                {cellText(row.origin)} · {cellText(row.flight_minutes)} min · {cellText(row.as_of)} · {cellText(row.review_status)}
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}

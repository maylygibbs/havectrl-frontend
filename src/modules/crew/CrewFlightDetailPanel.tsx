import { Locale, t } from '../../i18n/catalog';
import { cellText } from '../../ui/table';
import type { RosterAssignment } from './crew-schedule-roster';
import { flightCodeFromNotes, formatTimeLt, routeFromAssignment } from './crew-schedule-roster';
import { crewInitials } from './crew-utils';

type Props = {
  locale: Locale;
  assignment: RosterAssignment | null;
  crewOnFlight: RosterAssignment[];
  onEdit: () => void;
  onClear: () => void;
};

export function CrewFlightDetailPanel({ locale, assignment, crewOnFlight, onEdit, onClear }: Props) {
  const copy = t(locale);

  if (!assignment) {
    return (
      <aside className="crew-flight-detail panel-light" aria-label={copy.crew.selectedFlight}>
        <p className="status crew-flight-detail-empty">{copy.crew.selectFlightCell}</p>
      </aside>
    );
  }

  const notes = String(assignment.notes ?? '');
  const code = String(assignment.flight_code ?? '').trim() || flightCodeFromNotes(notes);
  const route = routeFromAssignment(assignment);
  const registration = String(assignment.aircraft_registration ?? '').trim();
  const start = new Date(String(assignment.starts_at));
  const dateLabel = Number.isNaN(start.getTime())
    ? '—'
    : start.toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <aside className="crew-flight-detail panel-light" aria-label={copy.crew.selectedFlight}>
      <header className="crew-flight-detail-head">
        <h3>{copy.crew.selectedFlight}</h3>
        <div className="actions">
          <button type="button" className="ghost btn-compact" onClick={onEdit}>
            {copy.crew.editFlightAssignment}
          </button>
          <button type="button" className="ghost btn-compact" onClick={onClear} aria-label={copy.cancel}>
            ×
          </button>
        </div>
      </header>

      <div className="crew-flight-detail-body">
        <div className="crew-flight-id-row">
          <strong className="crew-flight-code">{code}</strong>
          <span className="pill pill-info">{copy.crew.statusScheduled}</span>
        </div>
        <p className="crew-flight-date">{dateLabel}</p>

        <div className="crew-flight-route">
          <div>
            <span className="crew-flight-apt">{route.origin}</span>
            <span className="muted-label">{copy.crew.routeOrigin}</span>
          </div>
          <span className="crew-flight-route-arrow" aria-hidden="true">
            →
          </span>
          <div>
            <span className="crew-flight-apt">{route.destination}</span>
            <span className="muted-label">{copy.crew.routeDestination}</span>
          </div>
        </div>

        <dl className="crew-flight-times">
          <div>
            <dt>{copy.crew.departureLt}</dt>
            <dd>{formatTimeLt(String(assignment.starts_at))}</dd>
          </div>
          <div>
            <dt>{copy.crew.arrivalLt}</dt>
            <dd>{formatTimeLt(String(assignment.ends_at))}</dd>
          </div>
          <div>
            <dt>{copy.crew.aircraftLabel}</dt>
            <dd>{registration || copy.crew.aircraftNotSet}</dd>
          </div>
        </dl>

        <h4 className="crew-flight-crew-title">{copy.crew.crewOnFlight}</h4>
        <ul className="crew-flight-crew-list">
          {crewOnFlight.map((member) => (
            <li key={`${member.worker_id}-${member.id}`}>
              <span className="crew-avatar" aria-hidden="true">
                {crewInitials(String(member.full_name ?? '?'))}
              </span>
              <div>
                <strong>{cellText(member.full_name)}</strong>
                <span className="crew-directory-meta">{cellText(member.position ?? member.activity)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { cellText } from '../../ui/table';
import { CrewFlightDetailPanel } from './CrewFlightDetailPanel';
import {
  assignmentForCell,
  cellKind,
  cellLabels,
  dayColumns,
  flightGroupKey,
  monthColumns,
  type RosterAssignment,
  weekColumns,
} from './crew-schedule-roster';
import { crewInitials } from './crew-utils';

type WorkerRow = {
  id: string;
  full_name: string;
  position: string;
  status: string;
};

type Props = {
  locale: Locale;
  crewRows: WorkerRow[];
  scheduleRows: Record<string, unknown>[];
  onAddAssignment: (workerId: string | null) => void;
  onDeleteAssignment: (id: string) => void;
  onSelectWorker: (id: string) => void;
};

export function CrewSchedulePanel({
  locale,
  crewRows,
  scheduleRows,
  onAddAssignment,
  onDeleteAssignment,
  onSelectWorker,
}: Props) {
  const copy = t(locale);
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [crewFilter, setCrewFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<RosterAssignment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const assignments = useMemo(
    () =>
      scheduleRows.map(
        (row) =>
          ({
            id: String(row.id),
            worker_id: String(row.worker_id ?? ''),
            full_name: String(row.full_name ?? ''),
            employee_code: String(row.employee_code ?? ''),
            activity: String(row.activity ?? ''),
            starts_at: String(row.starts_at ?? ''),
            ends_at: String(row.ends_at ?? ''),
            notes: String(row.notes ?? ''),
            flight_code: row.flight_code as string | null | undefined,
            origin: row.origin as string | null | undefined,
            destination: row.destination as string | null | undefined,
            aircraft_registration: row.aircraft_registration as string | null | undefined,
            position: String(row.position ?? ''),
          }) satisfies RosterAssignment,
      ),
    [scheduleRows],
  );

  const anchor = useMemo(() => new Date(Date.UTC(year, monthIndex, 15)), [year, monthIndex]);

  const columns = useMemo(() => {
    if (view === 'day') return dayColumns(anchor, today);
    if (view === 'week') return weekColumns(anchor, today);
    return monthColumns(year, monthIndex, today);
  }, [view, anchor, year, monthIndex, today]);

  const workers = useMemo(() => {
    return crewRows.filter((w) => {
      if (crewFilter && w.id !== crewFilter) return false;
      if (statusFilter && w.status !== statusFilter) return false;
      return true;
    });
  }, [crewRows, crewFilter, statusFilter]);

  const monthLabel = useMemo(() => {
    return new Date(year, monthIndex, 1).toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [year, monthIndex, locale]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('.crew-roster-day.is-today, .crew-roster-td.is-today');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [year, monthIndex, view, scheduleRows.length]);

  const crewOnFlight = useMemo(() => {
    if (!selected || cellKind(selected.activity) !== 'flight') return selected ? [selected] : [];
    const key = flightGroupKey(selected);
    return assignments.filter((a) => flightGroupKey(a) === key && cellKind(a.activity) === 'flight');
  }, [selected, assignments]);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, monthIndex + delta, 1));
    setYear(d.getUTCFullYear());
    setMonthIndex(d.getUTCMonth());
  }

  function handleCellClick(row: RosterAssignment | null, workerId: string) {
    if (!row) return;
    const kind = cellKind(row.activity);
    if (kind === 'flight') {
      setSelected(row);
      onSelectWorker(workerId);
      return;
    }
    setSelected(row);
    onSelectWorker(workerId);
  }

  return (
    <div className="crew-schedule-panel crew-schedule-v02">
      <p className="status crew-schedule-hint">{copy.crew.scheduleAssignHint}</p>

      <div className="crew-schedule-controls">
        <div className="crew-month-nav">
          <button type="button" className="ghost btn-compact crew-month-arrow" onClick={() => shiftMonth(-1)} aria-label={copy.crew.prevMonth}>
            ‹
          </button>
          <strong className="crew-month-label">{monthLabel}</strong>
          <button type="button" className="ghost btn-compact crew-month-arrow" onClick={() => shiftMonth(1)} aria-label={copy.crew.nextMonth}>
            ›
          </button>
        </div>

        <div className="crew-view-toggle" role="group" aria-label={copy.crew.scheduleView}>
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} type="button" className={view === v ? 'crew-mode on' : 'crew-mode'} onClick={() => setView(v)}>
              {v === 'day' ? copy.crew.viewDay : v === 'week' ? copy.crew.viewWeek : copy.crew.viewMonth}
            </button>
          ))}
        </div>

        <div className="crew-schedule-filters">
          <select
            value={crewFilter}
            onChange={(e) => {
              const v = e.target.value;
              setCrewFilter(v);
              if (v) onSelectWorker(v);
            }}
            aria-label={copy.crew.allCrewMembers}
          >
            <option value="">{copy.crew.allCrewMembers}</option>
            {crewRows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={copy.crew.allStatuses}>
            <option value="">{copy.crew.allStatuses}</option>
            <option value="active">{copy.crew.statusActive}</option>
            <option value="inactive">{copy.crew.statusInactive}</option>
          </select>
        </div>
      </div>

      <div className="crew-roster-layout">
        <div className="crew-roster-main panel-light">
          <div className="crew-roster-scroll" ref={scrollRef}>
            <table className="crew-roster-table">
              <thead>
                <tr>
                  <th className="crew-roster-sticky-col">{copy.crew.rosterCrewColumn}</th>
                  {columns.map((col) => (
                    <th key={col.key} className={col.isToday ? 'crew-roster-day is-today' : 'crew-roster-day'}>
                      <span className="crew-roster-dow">{col.weekday}</span>
                      <span className="crew-roster-dom">{col.day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1}>
                      <p className="status">{copy.empty}</p>
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="crew-roster-sticky-col">
                        <div className="crew-roster-person">
                          <span className="crew-avatar" aria-hidden="true">
                            {crewInitials(worker.full_name)}
                          </span>
                          <div>
                            <span className="crew-directory-name">{cellText(worker.full_name)}</span>
                            <span className="crew-directory-meta">{cellText(worker.position)}</span>
                          </div>
                        </div>
                      </td>
                      {columns.map((col) => {
                        const row = assignmentForCell(assignments, worker.id, col.key);
                        const kind = row ? cellKind(row.activity) : 'available';
                        const labels = cellLabels(kind, row);
                        const isSelected = selected?.id === row?.id;
                        return (
                          <td key={col.key} className={col.isToday ? 'crew-roster-td is-today' : 'crew-roster-td'}>
                            <button
                              type="button"
                              className={`crew-roster-cell kind-${kind}${isSelected ? ' is-selected' : ''}`}
                              disabled={!row}
                              onClick={() => handleCellClick(row, worker.id)}
                            >
                              <span>{labels.line1}</span>
                              {labels.line2 ? <span className="crew-roster-cell-sub">{labels.line2}</span> : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="crew-roster-legend">
            <span className="crew-legend-item">
              <i className="crew-legend-swatch kind-available" /> {copy.crew.legendAvailable}
            </span>
            <span className="crew-legend-item">
              <i className="crew-legend-swatch kind-flight" /> {copy.crew.legendAssigned}
            </span>
            <span className="crew-legend-item">
              <i className="crew-legend-swatch kind-training" /> {copy.crew.legendTraining}
            </span>
            <span className="crew-legend-item">
              <i className="crew-legend-swatch kind-off" /> {copy.crew.legendRest}
            </span>
          </footer>
        </div>

        <CrewFlightDetailPanel
          locale={locale}
          assignment={selected && cellKind(selected.activity) === 'flight' ? selected : null}
          crewOnFlight={crewOnFlight}
          onEdit={() => {
            if (selected) {
              onSelectWorker(selected.worker_id);
              onAddAssignment(selected.worker_id);
            }
          }}
          onClear={() => setSelected(null)}
        />
      </div>

      {selected && cellKind(selected.activity) !== 'flight' ? (
        <div className="crew-roster-selection-actions panel-light">
          <p>
            {cellText(selected.full_name)} · {cellText(selected.activity)} · {cellText(selected.starts_at)}
          </p>
          <button type="button" className="ghost danger btn-compact" onClick={() => onDeleteAssignment(selected.id)}>
            {copy.softDelete}
          </button>
        </div>
      ) : null}
    </div>
  );
}

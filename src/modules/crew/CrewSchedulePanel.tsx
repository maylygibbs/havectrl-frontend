import { useEffect, useMemo, useRef, useState } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { Autocomplete } from '../../ui/Autocomplete';
import { cellText } from '../../ui/table';
import { CrewFlightDetailPanel } from './CrewFlightDetailPanel';
import {
  type ActivityFilterKey,
  activityFilterKey,
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

const ACTIVITY_FILTERS: {
  key: ActivityFilterKey;
  label: 'activityFlight' | 'activityWork' | 'activityStandby' | 'activityDayOff' | 'activityRest' | 'activityTraining' | 'activityAbsence' | 'activityUnavailable';
}[] = [
  { key: 'flight', label: 'activityFlight' },
  { key: 'work', label: 'activityWork' },
  { key: 'standby', label: 'activityStandby' },
  { key: 'dayOff', label: 'activityDayOff' },
  { key: 'rest', label: 'activityRest' },
  { key: 'training', label: 'activityTraining' },
  { key: 'absence', label: 'activityAbsence' },
  { key: 'unavailable', label: 'activityUnavailable' },
];

type Props = {
  locale: Locale;
  crewRows: WorkerRow[];
  scheduleRows: Record<string, unknown>[];
  onCreateAt: (workerId: string, dayKey: string) => void;
  onEdit: (row: RosterAssignment) => void;
  onMove: (assignmentId: string, dayKey: string) => void;
  onDeleteAssignment: (id: string) => void;
  onPublishAssignment: (id: string) => void;
  onRequestChange: (id: string, reason: string) => void;
};

export function CrewSchedulePanel({
  locale,
  crewRows,
  scheduleRows,
  onCreateAt,
  onEdit,
  onMove,
  onDeleteAssignment,
  onPublishAssignment,
  onRequestChange,
}: Props) {
  const [changeReason, setChangeReason] = useState('');
  const copy = t(locale);
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [crewFilter, setCrewFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activityFilters, setActivityFilters] = useState<ActivityFilterKey[]>([]);
  const [selected, setSelected] = useState<RosterAssignment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; workerId: string } | null>(null);
  const dragged = useRef(false);

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
            publication_status: String(row.publication_status ?? ''),
            position: String(row.position ?? ''),
          }) satisfies RosterAssignment,
      ),
    [scheduleRows],
  );

  const anchor = useMemo(() => {
    const now = new Date();
    if (year === now.getFullYear() && monthIndex === now.getMonth()) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    return new Date(year, monthIndex, 1);
  }, [year, monthIndex]);

  const columns = useMemo(() => {
    if (view === 'day') return dayColumns(anchor, today);
    if (view === 'week') return weekColumns(anchor, today);
    return monthColumns(year, monthIndex, today);
  }, [view, anchor, year, monthIndex, today]);

  const workers = useMemo(() => {
    return crewRows.filter((worker) => {
      if (crewFilter && worker.id !== crewFilter) return false;
      if (statusFilter === 'active' && worker.status !== 'active') return false;
      if (statusFilter === 'inactive' && worker.status === 'active') return false;
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
    return assignments.filter((item) => flightGroupKey(item) === key && cellKind(item.activity) === 'flight');
  }, [selected, assignments]);

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1));
    setYear(next.getUTCFullYear());
    setMonthIndex(next.getUTCMonth());
  }

  function toggleActivity(key: ActivityFilterKey) {
    setActivityFilters((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function shown(row: RosterAssignment | null) {
    if (!row) return null;
    if (activityFilters.length > 0 && !activityFilters.includes(activityFilterKey(row.activity))) return null;
    return row;
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
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button key={mode} type="button" className={view === mode ? 'crew-mode on' : 'crew-mode'} onClick={() => setView(mode)}>
              {mode === 'day' ? copy.crew.viewDay : mode === 'week' ? copy.crew.viewWeek : copy.crew.viewMonth}
            </button>
          ))}
        </div>

        <div className="crew-schedule-filters">
          <Autocomplete
            id="schedule-person"
            options={crewRows.map((worker) => ({ value: worker.id, label: worker.full_name }))}
            values={crewFilter ? [crewFilter] : []}
            placeholder={copy.crew.allCrewMembers}
            emptyLabel={copy.empty}
            onChange={(values) => setCrewFilter(values[0] ?? '')}
          />
        </div>
      </div>

      <div className="magic-filters" role="group" aria-label={copy.crew.status}>
        <button type="button" className={`magic-chip${statusFilter === 'all' ? ' is-on' : ''}`} onClick={() => setStatusFilter('all')}>
          {copy.crew.filterAll}
        </button>
        <button type="button" className={`magic-chip${statusFilter === 'active' ? ' is-on' : ''}`} onClick={() => setStatusFilter('active')}>
          {copy.crew.filterActive}
        </button>
        <button type="button" className={`magic-chip${statusFilter === 'inactive' ? ' is-on' : ''}`} onClick={() => setStatusFilter('inactive')}>
          {copy.crew.filterInactive}
        </button>
      </div>
      <div className="magic-filters crew-activity-filters" role="group" aria-label={copy.crew.activity}>
        <button type="button" className={`magic-chip${activityFilters.length === 0 ? ' is-on' : ''}`} onClick={() => setActivityFilters([])}>
          {copy.crew.filterAll}
        </button>
        {ACTIVITY_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`magic-chip${activityFilters.includes(item.key) ? ' is-on' : ''}`}
            onClick={() => toggleActivity(item.key)}
          >
            {copy.crew[item.label]}
          </button>
        ))}
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
                        const stored = assignmentForCell(assignments, worker.id, col.key);
                        const row = shown(stored);
                        const hidden = Boolean(stored && !row);
                        const kind = row ? cellKind(row.activity) : 'available';
                        const labels = cellLabels(kind, row, copy.crew.activityShort);
                        const isSelected = selected?.id === row?.id;
                        return (
                          <td key={col.key} className={col.isToday ? 'crew-roster-td is-today' : 'crew-roster-td'}>
                            <button
                              type="button"
                              draggable={Boolean(row)}
                              disabled={hidden}
                              className={`crew-roster-cell kind-${kind}${isSelected ? ' is-selected' : ''}${hidden ? ' is-filtered' : ''}`}
                              onClick={() => {
                                if (dragged.current) {
                                  dragged.current = false;
                                  return;
                                }
                                if (row) {
                                  setSelected(row);
                                  onEdit(row);
                                  return;
                                }
                                if (!hidden) onCreateAt(worker.id, col.key);
                              }}
                              onDragStart={() => {
                                if (!row) return;
                                dragged.current = true;
                                dragRef.current = { id: row.id, workerId: worker.id };
                              }}
                              onDragEnd={() => {
                                dragRef.current = null;
                              }}
                              onDragOver={(event) => {
                                const drag = dragRef.current;
                                if (drag && drag.workerId === worker.id && !stored) event.preventDefault();
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                const drag = dragRef.current;
                                dragRef.current = null;
                                if (!drag || drag.workerId !== worker.id || stored) return;
                                onMove(drag.id, col.key);
                              }}
                            >
                              <span>{hidden ? '·' : labels.line1}</span>
                              {!hidden && labels.line2 ? <span className="crew-roster-cell-sub">{labels.line2}</span> : null}
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
            if (selected) onEdit(selected);
          }}
          onClear={() => setSelected(null)}
        />
      </div>

      {selected ? (
        <div className="crew-roster-selection-actions panel-light">
          <p>
            {cellText(selected.full_name)} · {cellText(selected.activity)} · {cellText(selected.starts_at)} ·{' '}
            {copy.crew.publication}: {cellText(selected.publication_status)}
          </p>
          <div className="actions">
            <button type="button" className="btn-compact" onClick={() => onEdit(selected)}>
              {copy.crew.editAssignment}
            </button>
            <button type="button" className="btn-compact" onClick={() => onPublishAssignment(selected.id)}>
              {copy.crew.publish}
            </button>
            <input
              value={changeReason}
              onChange={(event) => setChangeReason(event.target.value)}
              placeholder={copy.crew.changeReason}
              aria-label={copy.crew.changeReason}
            />
            <button
              type="button"
              className="ghost btn-compact"
              onClick={() => {
                if (!changeReason.trim()) return;
                onRequestChange(selected.id, changeReason.trim());
                setChangeReason('');
              }}
            >
              {copy.crew.requestChange}
            </button>
            <button type="button" className="ghost danger btn-compact" onClick={() => onDeleteAssignment(selected.id)}>
              {copy.softDelete}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

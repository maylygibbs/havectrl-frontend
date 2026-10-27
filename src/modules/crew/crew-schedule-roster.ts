export type ScheduleCellKind = 'available' | 'flight' | 'training' | 'off';

export type RosterAssignment = {
  id: string;
  worker_id: string;
  full_name?: string;
  employee_code?: string;
  position?: string;
  activity: string;
  starts_at: string;
  ends_at: string;
  notes: string;
  flight_code?: string | null;
  origin?: string | null;
  destination?: string | null;
  aircraft_registration?: string | null;
  publication_status?: string | null;
};

export type DayColumn = {
  key: string;
  day: number;
  weekday: string;
  isToday: boolean;
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function cellKind(activity: string): ScheduleCellKind {
  const a = activity.trim().toLowerCase();
  if (a.includes('flight') || a.includes('duty')) return 'flight';
  if (a.includes('train') || a.includes('formaci')) return 'training';
  if (a.includes('work') || a.includes('trabajo')) return 'training';
  if (a.includes('rest') || a.includes('off') || a.includes('libre') || a.includes('standby') || a.includes('guardia') || a.includes('unavail') || a.includes('indisp')) return 'off';
  return 'flight';
}

/** Calendar day in the browser timezone (matches datetime-local and column headers). */
export function dayKeyLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function calendarDayKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function monthColumns(year: number, monthIndex: number, today = new Date()): DayColumn[] {
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cols: DayColumn[] = [];
  for (let day = 1; day <= days; day += 1) {
    const d = new Date(year, monthIndex, day);
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    cols.push({
      key: calendarDayKey(year, monthIndex, day),
      day,
      weekday: DOW[d.getDay()] ?? '',
      isToday,
    });
  }
  return cols;
}

export function weekColumns(anchor: Date, today = new Date()): DayColumn[] {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const dow = start.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + mondayOffset);
  const cols: DayColumn[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cols.push({
      key: dayKeyLocal(d.toISOString()),
      day: d.getDate(),
      weekday: DOW[d.getDay()] ?? '',
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate(),
    });
  }
  return cols;
}

export function dayColumns(anchor: Date, today = new Date()): DayColumn[] {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  return [
    {
      key: dayKeyLocal(d.toISOString()),
      day: d.getDate(),
      weekday: DOW[d.getDay()] ?? '',
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate(),
    },
  ];
}

export function assignmentForCell(
  assignments: RosterAssignment[],
  workerId: string,
  dayKey: string,
): RosterAssignment | null {
  for (const row of assignments) {
    if (String(row.worker_id) !== workerId) continue;
    if (dayKeyLocal(String(row.starts_at)) === dayKey) return row;
  }
  return null;
}

export function flightGroupKey(row: RosterAssignment): string {
  const code = String(row.flight_code ?? '').trim();
  if (code) {
    return `${dayKeyLocal(row.starts_at)}|${code}|${String(row.origin ?? '')}|${String(row.destination ?? '')}`;
  }
  return `${dayKeyLocal(row.starts_at)}|${String(row.notes ?? '').trim()}|${String(row.activity ?? '').trim()}`;
}

export function flightCodeFromNotes(notes: string): string {
  const m = notes.match(/\bHV\d+\b/i);
  return m ? m[0].toUpperCase() : notes.split(/\s+/)[0]?.slice(0, 12) || '—';
}

export function routeFromAssignment(row: RosterAssignment): { origin: string; destination: string } {
  const o = String(row.origin ?? '').trim();
  const d = String(row.destination ?? '').trim();
  if (o && d) return { origin: o, destination: d };
  return routeFromNotes(String(row.notes ?? ''));
}

export function routeFromNotes(notes: string): { origin: string; destination: string } {
  const codes = notes.match(/\b[A-Z]{4}\b/g);
  if (codes && codes.length >= 2) {
    return { origin: codes[0], destination: codes[1] };
  }
  if (codes?.length === 1) {
    return { origin: codes[0], destination: '—' };
  }
  return { origin: '—', destination: '—' };
}

export function cellLabels(kind: ScheduleCellKind, row: RosterAssignment | null): { line1: string; line2: string } {
  if (!row || kind === 'available') return { line1: '—', line2: '' };
  if (kind === 'off') return { line1: 'OFF', line2: '' };
  if (kind === 'training') return { line1: 'TRG', line2: '' };
  const code = String(row.flight_code ?? '').trim();
  const route = routeFromAssignment(row);
  if (route.origin !== '—') {
    return { line1: route.origin, line2: route.destination };
  }
  const notes = String(row.notes ?? '');
  if (code) return { line1: code, line2: notes.split('/')[1]?.trim() ?? '' };
  return { line1: flightCodeFromNotes(notes), line2: notes.split('/')[1]?.trim() ?? '' };
}

export function formatTimeLt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

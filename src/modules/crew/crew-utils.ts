export function crewInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function licenseAlert(expires: unknown): 'ok' | 'warn' | 'expired' | null {
  if (expires == null || expires === '') return null;
  const date = new Date(String(expires).slice(0, 10));
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (date.getTime() - today.getTime()) / (86400000);
  if (diff < 0) return 'expired';
  if (diff <= 60) return 'warn';
  return 'ok';
}

export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default start ≈ next whole hour; end +2 h (Schedule modal). */
export function defaultAssignmentRange(): { start: string; end: string } {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) };
}

export function uniqueValues(rows: Record<string, unknown>[], key: string) {
  const set = new Set<string>();
  for (const row of rows) {
    const v = String(row[key] ?? '').trim();
    if (v) set.add(v);
  }
  return [...set].sort();
}

export type Magnitude = 'length' | 'speed' | 'mass' | 'volume' | 'temperature' | 'pressure' | 'time';

export const MAGNITUDES: Magnitude[] = [
  'length',
  'speed',
  'mass',
  'volume',
  'temperature',
  'pressure',
  'time',
];

export const UNITS: Record<Magnitude, string[]> = {
  length: ['m', 'km', 'ft', 'NM', 'mi'],
  speed: ['kt', 'km/h', 'mph', 'm/s', 'ft/min'],
  mass: ['mg', 'g', 'kg', 'lb', 'oz'],
  volume: ['mL', 'L', 'US gal', 'Imperial gal'],
  temperature: ['°C', '°F', 'K'],
  pressure: ['Pa', 'hPa', 'inHg', 'psi', 'bar'],
  time: ['s', 'min', 'h', 'HH:MM'],
};

const TO_BASE: Record<Exclude<Magnitude, 'temperature' | 'time'>, Record<string, number>> = {
  length: { m: 1, km: 1000, ft: 0.3048, NM: 1852, mi: 1609.344 },
  speed: { kt: 1.852, 'km/h': 1, mph: 1.609344, 'm/s': 3.6, 'ft/min': 0.018288 },
  mass: { mg: 1e-6, g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523125 },
  volume: { mL: 0.001, L: 1, 'US gal': 3.785411784, 'Imperial gal': 4.54609 },
  pressure: { Pa: 1, hPa: 100, inHg: 3386.389, psi: 6894.757293168, bar: 100000 },
};

export type ConvertResult =
  | { ok: true; value: number; text: string; unit: string }
  | { ok: false; reason: 'empty' | 'invalid' | 'range' | 'unit' };

export function convertUnit(magnitude: Magnitude, raw: string, from: string, to: string): ConvertResult {
  const input = raw.trim();
  if (!input) return { ok: false, reason: 'empty' };
  if (!UNITS[magnitude].includes(from) || !UNITS[magnitude].includes(to)) {
    return { ok: false, reason: 'unit' };
  }
  const value = magnitude === 'time' ? timeToHours(input, from) : readNumber(input);
  if (value == null) return { ok: false, reason: 'invalid' };
  if (magnitude === 'temperature') {
    const kelvin = toKelvin(value, from);
    if (kelvin == null || kelvin < 0) return { ok: false, reason: 'range' };
    return finish(fromKelvin(kelvin, to), to);
  }
  if (magnitude === 'time') {
    if (value < 0) return { ok: false, reason: 'range' };
    if (to === 'HH:MM') return { ok: true, value, text: clockFromHours(value), unit: to };
    return finish(fromHours(value, to), to);
  }
  if (value < 0) return { ok: false, reason: 'range' };
  const table = TO_BASE[magnitude];
  return finish((value * table[from]) / table[to], to);
}

export function formatMeasure(value: number): string {
  if (!Number.isFinite(value)) return '';
  const text = value.toFixed(9).replace(/\.?0+$/, '');
  return text === '-0' ? '0' : text;
}

function finish(value: number, unit: string): ConvertResult {
  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  return { ok: true, value, text: formatMeasure(value), unit };
}

function readNumber(input: string): number | null {
  if (!/^-?\d+(\.\d+)?$/.test(input)) return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

function timeToHours(input: string, unit: string): number | null {
  if (unit === 'HH:MM') {
    const match = /^(\d+):([0-5]\d)$/.exec(input);
    if (!match) return null;
    return Number(match[1]) + Number(match[2]) / 60;
  }
  const value = readNumber(input);
  if (value == null) return null;
  if (unit === 's') return value / 3600;
  if (unit === 'min') return value / 60;
  if (unit === 'h') return value;
  return null;
}

function fromHours(hours: number, unit: string): number {
  if (unit === 'min') return hours * 60;
  if (unit === 's') return hours * 3600;
  return hours;
}

function clockFromHours(hours: number): string {
  const total = Math.round(hours * 60);
  const whole = Math.floor(total / 60);
  const minutes = total % 60;
  return `${whole}:${String(minutes).padStart(2, '0')}`;
}

function toKelvin(value: number, unit: string): number | null {
  if (unit === 'K') return value;
  if (unit === '°C') return value + 273.15;
  if (unit === '°F') return ((value - 32) * 5) / 9 + 273.15;
  return null;
}

function fromKelvin(kelvin: number, unit: string): number {
  if (unit === 'K') return kelvin;
  if (unit === '°C') return kelvin - 273.15;
  return ((kelvin - 273.15) * 9) / 5 + 32;
}

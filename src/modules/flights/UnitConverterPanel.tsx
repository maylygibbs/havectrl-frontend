import { useEffect, useState } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { MAGNITUDES, Magnitude, UNITS, convertUnit } from './unit-convert';

const STORAGE_KEY = 'havectrl:unit-converter';

type Entry = { origin: string; result: string };

export function UnitConverterPanel({ locale }: { locale: Locale }) {
  const copy = t(locale).converter;
  const [magnitude, setMagnitude] = useState<Magnitude>('time');
  const [from, setFrom] = useState('HH:MM');
  const [to, setTo] = useState('h');
  const [raw, setRaw] = useState('01:30');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<Entry[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as Entry[];
      if (Array.isArray(saved)) setHistory(saved.slice(0, 12));
    } catch {
      setHistory([]);
    }
  }, []);

  const units = UNITS[magnitude];
  const result = convertUnit(magnitude, raw, from, to);
  const labels: Record<Magnitude, string> = {
    length: copy.length,
    speed: copy.speed,
    mass: copy.mass,
    volume: copy.volume,
    temperature: copy.temperature,
    pressure: copy.pressure,
    time: copy.time,
  };

  function chooseMagnitude(next: Magnitude) {
    setMagnitude(next);
    setFrom(UNITS[next][0]);
    setTo(UNITS[next][1]);
    setRaw(next === 'time' ? '01:30' : '1');
    setNotice('');
  }

  function remember(origin: string, converted: string) {
    const next = [{ origin, result: converted }, ...history].slice(0, 12);
    setHistory(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* the conversion still stands */
    }
  }

  async function copyResult() {
    if (!result.ok) return;
    const text = `${result.text} ${result.unit}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice(copy.copied);
      remember(`${raw.trim()} ${from}`, text);
    } catch {
      setNotice(copy.copyFailed);
    }
  }

  return (
    <div className="stack">
      <div className="magic-filters" role="group" aria-label={copy.value}>
        {MAGNITUDES.map((item) => (
          <button
            key={item}
            type="button"
            className={`magic-chip${magnitude === item ? ' is-on' : ''}`}
            onClick={() => chooseMagnitude(item)}
          >
            {labels[item]}
          </button>
        ))}
      </div>
      {magnitude === 'time' ? <p className="status">{copy.timeHint}</p> : null}
      <label htmlFor="convert-value">{copy.value}</label>
      <input
        id="convert-value"
        value={raw}
        inputMode={from === 'HH:MM' ? 'text' : 'decimal'}
        onChange={(event) => {
          setRaw(event.target.value);
          setNotice('');
        }}
      />
      <label htmlFor="convert-from">{copy.from}</label>
      <select id="convert-from" value={from} onChange={(event) => setFrom(event.target.value)}>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
      <label htmlFor="convert-to">{copy.to}</label>
      <select id="convert-to" value={to} onChange={(event) => setTo(event.target.value)}>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
      <p>
        {copy.result}: <strong>{result.ok ? `${result.text} ${result.unit}` : '—'}</strong>
      </p>
      {!result.ok && (result.reason === 'invalid' || result.reason === 'range') ? (
        <p className="error">{copy.invalidValue}</p>
      ) : null}
      <div className="actions">
        <button
          type="button"
          onClick={() => {
            if (!result.ok) return;
            const previous = from;
            setFrom(to);
            setTo(previous);
            setRaw(result.text);
            setNotice('');
          }}
        >
          {copy.swap}
        </button>
        <button type="button" onClick={copyResult} disabled={!result.ok}>
          {copy.copyResult}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setRaw('');
            setNotice('');
          }}
        >
          {copy.clear}
        </button>
      </div>
      {notice ? <p className="status">{notice}</p> : null}
      <h3>{copy.history}</h3>
      {history.length === 0 ? <p className="status">{copy.emptyHistory}</p> : null}
      {history.length > 0 ? (
        <ul>
          {history.map((entry, index) => (
            <li key={`${index}-${entry.origin}-${entry.result}`}>
              {entry.origin} → {entry.result}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

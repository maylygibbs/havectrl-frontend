import { useMemo, useState } from 'react';
import { columnLabel, Locale, t } from '../i18n/catalog';
import { TableSearchBar } from './TableSearchBar';
import { filterRowsBySearch } from './table-filter';

export function DataTable({
  rows,
  columns,
  locale,
  onOpen,
  searchOmitKeys,
  searchable = true,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
  locale: Locale;
  onOpen?: (id: string) => void;
  searchOmitKeys?: string[];
  searchable?: boolean;
}) {
  const copy = t(locale);
  const [query, setQuery] = useState('');
  const visible = useMemo(
    () => (searchable ? filterRowsBySearch(rows, query, searchOmitKeys) : rows),
    [rows, query, searchOmitKeys, searchable],
  );

  if (!rows.length) return <p className="status">{copy.empty}</p>;

  return (
    <div className="table-stack">
      {searchable ? <TableSearchBar locale={locale} value={query} onChange={setQuery} /> : null}
      {!visible.length ? (
        <p className="status">{copy.empty}</p>
      ) : (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{columnLabel(locale, column)}</th>
            ))}
            {onOpen ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => (
                <td key={column}>{cellText(row[column])}</td>
              ))}
              {onOpen ? (
                <td>
                  <button type="button" className="ghost btn-compact" onClick={() => onOpen(String(row.id))}>
                    {copy.open}
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      )}
    </div>
  );
}

export function DetailPanel({
  data,
  locale,
  showTitle = true,
}: {
  data: Record<string, unknown>;
  locale: Locale;
  showTitle?: boolean;
}) {
  return (
    <section className="panel-light detail">
      {showTitle ? <h2>{t(locale).sections.detail}</h2> : null}
      {Object.entries(data).map(([key, value]) =>
        Array.isArray(value) ? (
          <div key={key}>
            <h3>{columnLabel(locale, key)}</h3>
            <DataTable
              rows={value as Record<string, unknown>[]}
              columns={columnsOf(value)}
              locale={locale}
            />
          </div>
        ) : value && typeof value === 'object' ? (
          <dl key={key}>
            {Object.entries(value as Record<string, unknown>).map(([field, fieldValue]) => (
              <div key={field}>
                <dt>{columnLabel(locale, field)}</dt>
                <dd>{cellText(fieldValue)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p key={key}>
            {columnLabel(locale, key)}: {cellText(value)}
          </p>
        ),
      )}
    </section>
  );
}

function columnsOf(rows: unknown[]) {
  const first = rows[0];
  if (!first || typeof first !== 'object') return [];
  return Object.keys(first as Record<string, unknown>).filter((key) => key !== 'id');
}

export function cellText(value: unknown) {
  if (value == null || value === '') return '�';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

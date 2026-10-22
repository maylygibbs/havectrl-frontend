import { useMemo, useState } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { StatusPill } from '../../ui/ModuleChrome';
import { TableSearchBar } from '../../ui/TableSearchBar';
import { filterMasterItems } from '../../ui/table-filter';
import { crewInitials } from './crew-utils';

export type CrewListItem = {
  id: string;
  title: string;
  employeeCode: string;
  position: string;
  base: string;
  status: string;
  alert: 'ok' | 'warn' | 'expired' | null;
};

type Props = {
  locale: Locale;
  items: CrewListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddWorker: () => void;
  empty: string;
};

export function CrewDirectory({ locale, items, selectedId, onSelect, onAddWorker, empty }: Props) {
  const copy = t(locale);
  const [query, setQuery] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  const bases = useMemo(() => [...new Set(items.map((i) => i.base).filter(Boolean))].sort(), [items]);
  const statuses = useMemo(() => [...new Set(items.map((i) => i.status).filter(Boolean))].sort(), [items]);
  const positions = useMemo(() => [...new Set(items.map((i) => i.position).filter(Boolean))].sort(), [items]);

  const filtered = useMemo(() => {
    let list = filterMasterItems(
      items.map((i) => ({ id: i.id, title: i.title, subtitle: `${i.employeeCode} · ${i.position}`, status: i.status })),
      query,
    ).map((row) => items.find((i) => i.id === row.id)!);
    if (baseFilter) list = list.filter((i) => i.base === baseFilter);
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);
    if (positionFilter) list = list.filter((i) => i.position === positionFilter);
    return list;
  }, [items, query, baseFilter, statusFilter, positionFilter]);

  return (
    <aside className="crew-directory panel-light">
      <header className="panel-head crew-directory-head">
        <h2>{copy.crew.directory}</h2>
        <button type="button" className="btn-compact crew-add-worker" onClick={onAddWorker}>
          {copy.crew.newWorker}
        </button>
      </header>

      {items.length > 0 ? <TableSearchBar locale={locale} value={query} onChange={setQuery} id="crew-dir-search" /> : null}

      <div className="crew-filters" role="group" aria-label={copy.crew.filters}>
        <select value={baseFilter} onChange={(e) => setBaseFilter(e.target.value)} aria-label={copy.crew.base}>
          <option value="">{copy.crew.allBases}</option>
          {bases.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} aria-label={copy.crew.position}>
          <option value="">{copy.crew.allPositions}</option>
          {positions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={copy.crew.status}>
          <option value="">{copy.crew.allStatuses}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {baseFilter || statusFilter || positionFilter ? (
          <button
            type="button"
            className="ghost btn-compact"
            onClick={() => {
              setBaseFilter('');
              setStatusFilter('');
              setPositionFilter('');
            }}
          >
            {copy.crew.clearFilters}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="status">{empty}</p>
      ) : filtered.length === 0 ? (
        <p className="status">{copy.empty}</p>
      ) : (
        <ul className="crew-directory-list">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === selectedId ? 'crew-directory-item on' : 'crew-directory-item'}
                onClick={() => onSelect(item.id)}
              >
                <span className="crew-avatar" aria-hidden="true">
                  {crewInitials(item.title)}
                </span>
                <span className="crew-directory-body">
                  <span className="crew-directory-name">{item.title}</span>
                  <span className="crew-directory-meta">
                    {item.employeeCode} · {item.position}
                  </span>
                  <span className="crew-directory-meta">{item.base}</span>
                </span>
                <span className="crew-directory-badges">
                  {item.alert === 'warn' || item.alert === 'expired' ? (
                    <span className={`crew-alert crew-alert-${item.alert}`} title={copy.crew.licenseAlert}>
                      !
                    </span>
                  ) : null}
                  <StatusPill status={item.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

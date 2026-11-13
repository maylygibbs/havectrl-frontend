import { useMemo, useState, type ReactNode } from 'react';
import { Locale, t } from '../i18n/catalog';
import { TableSearchBar } from './TableSearchBar';
import { filterMasterItems } from './table-filter';

type Tab = { id: string; label: string };

type HeroProps = {
  title: string;
  subtitle: string;
  image: string;
  meta?: string;
};

export function ModuleHero({ title, subtitle, image, meta }: HeroProps) {
  return (
    <section className="module-hero" aria-label={title}>
      <img className="module-hero-photo" src={image} alt="" />
      <div className="module-hero-shade" aria-hidden="true" />
      <div className="module-hero-copy">
        <h1 className="module-hero-title">{title}</h1>
        <p className="module-hero-sub">{subtitle}</p>
      </div>
      {meta ? <p className="module-hero-meta">{meta}</p> : null}
    </section>
  );
}

export function ModuleTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="module-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={tab.id === active ? 'module-tab on' : 'module-tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = toneOf(status);
  return <span className={`pill pill-${tone}`}>{status.replaceAll('_', ' ')}</span>;
}

function toneOf(status: string) {
  const s = status.toLowerCase();
  if (['active', 'arrived', 'on_time', 'valid', 'closed', 'confirmed', 'available', 'in_service', 'ok'].some((x) => s.includes(x))) {
    return 'ok';
  }
  if (['boarding', 'assigned', 'requested', 'in_progress', 'planned', 'info'].some((x) => s.includes(x))) {
    return 'info';
  }
  if (['deferred', 'due', 'warn', 'pending', 'open', 'leave'].some((x) => s.includes(x))) {
    return 'warn';
  }
  return 'muted';
}

export function MasterList({
  title,
  actionLabel,
  onAction,
  items,
  selectedId,
  onSelect,
  empty,
  locale,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: { id: string; title: string; subtitle?: string; status?: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  empty: string;
  locale: Locale;
}) {
  const copy = t(locale);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => filterMasterItems(items, query), [items, query]);

  return (
    <aside className="master-list panel-light">
      <header className="panel-head">
        <h2>{title}</h2>
        {actionLabel && onAction ? (
          <button type="button" className="btn-compact" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </header>
      {items.length > 0 ? <TableSearchBar locale={locale} value={query} onChange={setQuery} /> : null}
      {items.length === 0 ? (
        <p className="status">{empty}</p>
      ) : visible.length === 0 ? (
        <p className="status">{copy.empty}</p>
      ) : (
        <ul className="master-items">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === selectedId ? 'master-item on' : 'master-item'}
                onClick={() => onSelect(item.id)}
              >
                <span className="master-item-title">{item.title}</span>
                {item.subtitle ? <span className="master-item-sub">{item.subtitle}</span> : null}
                {item.status ? <StatusPill status={item.status} /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function DataPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel-light">
      <header className="panel-head">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

import { Locale, t } from '../i18n/catalog';

export function TableSearchBar({
  locale,
  value,
  onChange,
  id,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const copy = t(locale);
  return (
    <label className="table-search">
      <span className="sr-only">{copy.tableSearch}</span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.tableSearch}
        autoComplete="off"
      />
    </label>
  );
}

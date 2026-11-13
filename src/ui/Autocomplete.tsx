import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type AutocompleteOption = { value: string; label: string };

type Props = {
  id?: string;
  options: AutocompleteOption[];
  values: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  allowCustom?: boolean;
  placeholder?: string;
  emptyLabel?: string;
};

export function Autocomplete({ id, options, values, onChange, multiple = false, allowCustom = false, placeholder, emptyLabel }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = useMemo(
    () => values.map((value) => options.find((option) => option.value === value)).filter((option) => option != null),
    [options, values],
  );
  const available = useMemo(() => {
    const chosen = new Set(values);
    const needle = query.trim().toLowerCase();
    return options.filter((option) => {
      if (multiple && chosen.has(option.value)) return false;
      if (!needle) return true;
      return option.label.toLowerCase().includes(needle);
    });
  }, [multiple, options, query, values]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  function choose(value: string) {
    if (multiple) {
      onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
      setQuery('');
      return;
    }
    onChange([value]);
    setQuery('');
    setOpen(false);
  }

  const singleLabel = !multiple && !open ? (selected[0]?.label ?? (allowCustom ? (values[0] ?? '') : '')) : query;

  return (
    <div className="combo" ref={rootRef}>
      {multiple && selected.length > 0 ? (
        <ul className="combo-chips">
          {selected.map((option) => (
            <li key={option.value}>
              <button type="button" className="combo-chip" onClick={() => onChange(values.filter((item) => item !== option.value))}>
                {option.label}
                <span aria-hidden="true"> ×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={singleLabel}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!allowCustom || multiple) return;
          const typed = query.trim();
          if (typed) onChange([typed]);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!multiple && values.length) onChange([]);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, Math.max(available.length - 1, 0)));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && open) {
            event.preventDefault();
            if (available[active]) choose(available[active].value);
            else if (allowCustom && query.trim()) choose(query.trim());
          } else if (event.key === 'Escape') {
            setOpen(false);
          } else if (event.key === 'Backspace' && multiple && !query && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
      />
      {open ? (
        <ul className="combo-menu" id={listId} role="listbox">
          {available.length === 0 ? (
            <li className="combo-empty">{emptyLabel}</li>
          ) : (
            available.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? 'combo-option on' : 'combo-option'}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

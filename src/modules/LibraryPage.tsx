import { FormEvent, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { DataTable } from '../ui/table';

type Tab = 'documents' | 'reader' | 'revisions' | 'bookmarks';

type Props = {
  locale: Locale;
  isAdmin: boolean;
  rows: Record<string, unknown>[];
  bookmarks: Record<string, unknown>[];
  files: Record<string, unknown>[];
  onCreate: (body: Record<string, unknown>, file: File | null) => Promise<boolean>;
  onBookmark: (body: Record<string, unknown>) => Promise<boolean>;
  onOpen: (id: string) => void;
  onOpenOriginal: (fileId: string, name: string) => void;
};

const empty = () => ({
  code: '',
  title: '',
  category: '',
  edition: '',
  amendment: '',
  language: 'es',
  reference: '',
  status: 'draft',
});

export function LibraryPage({ locale, isAdmin, rows, bookmarks, files, onCreate, onBookmark, onOpen, onOpenOriginal }: Props) {
  const copy = t(locale);
  const formCopy = copy.libraryForm;
  const [tab, setTab] = useState<Tab>('documents');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState('1');
  const [note, setNote] = useState('');
  const selected = rows.find((row) => String(row.id) === selectedId) ?? null;
  const family = selected ? rows.filter((row) => String(row.reference) === String(selected.reference)) : [];
  const categories = [...new Set(rows.map((row) => String(row.category ?? '')).filter(Boolean))].map((value) => ({
    value,
    label: value,
  }));
  const languages = [...new Set(['en', 'es', ...rows.map((row) => String(row.language ?? '')).filter(Boolean)])].map((value) => ({
    value,
    label: value,
  }));
  const documents = rows.map((row) => ({
    value: String(row.id),
    label: `${String(row.code)} · ${String(row.edition)} · ${String(row.status)}`,
  }));
  const statuses: [string, string][] = [['draft', formCopy.statusDraft]];
  if (isAdmin) {
    statuses.push(
      ['current', formCopy.statusCurrent],
      ['superseded', formCopy.statusSuperseded],
      ['withdrawn', formCopy.statusWithdrawn],
    );
  }

  function choose(id: string) {
    setSelectedId(id);
    setTab('reader');
    onOpen(id);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onCreate(
      {
        code: form.code,
        title: form.title,
        category: form.category,
        edition: form.edition,
        amendment: form.amendment,
        language: form.language,
        reference: form.reference || form.code,
        status: form.status,
      },
      file,
    );
    if (ok) {
      setForm(empty());
      setFile(null);
      setOpen(false);
    }
  }

  async function saveBookmark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const ok = await onBookmark({ documentId: selectedId, page: Number(page), note });
    if (ok) setNote('');
  }

  return (
    <div className="module-page">
      <ModuleHero title={copy.modules.library} subtitle={copy.moduleSubs.library} image="/heroes/hero-library.png" />
      <ModuleTabs
        tabs={[
          { id: 'documents', label: copy.tabs.libDocuments },
          { id: 'reader', label: copy.tabs.libReader },
          { id: 'revisions', label: copy.tabs.libRevisions },
          { id: 'bookmarks', label: copy.tabs.libBookmarks },
        ]}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === 'documents' ? (
        <>
          <div className="module-toolbar">
            <button
              type="button"
              onClick={() => {
                setForm(empty());
                setFile(null);
                setOpen(true);
              }}
            >
              {formCopy.register}
            </button>
          </div>
          <DataPanel title={copy.tabs.libDocuments}>
            <DataTable
              rows={rows}
              columns={['code', 'title', 'category', 'edition', 'language', 'status']}
              locale={locale}
              onOpen={choose}
            />
          </DataPanel>
        </>
      ) : null}

      {tab === 'reader' ? (
        <DataPanel title={copy.tabs.libReader}>
          <label htmlFor="lib-pick">{formCopy.register}</label>
          <Autocomplete
            id="lib-pick"
            options={documents}
            values={selectedId ? [selectedId] : []}
            placeholder={formCopy.register}
            emptyLabel={copy.empty}
            onChange={(values) => {
              const id = values[0] ?? '';
              setSelectedId(id || null);
              if (id) onOpen(id);
            }}
          />
          {selected ? (
            <section className="stack">
              <h3>
                {String(selected.title)} · {String(selected.edition)}
              </h3>
              <p>
                {String(selected.code)} · {String(selected.language)} · {String(selected.status)}
              </p>
              {selected.status === 'superseded' ? <p className="status">{formCopy.supersededNote}</p> : null}
              {files[0] ? (
                <button type="button" onClick={() => onOpenOriginal(String(files[0].id), String(files[0].original_name ?? 'document.pdf'))}>
                  {formCopy.openOriginal}
                </button>
              ) : (
                <p className="status">{formCopy.noFile}</p>
              )}
              {selected.status === 'current' || selected.status === 'superseded' ? (
                <form className="stack" onSubmit={saveBookmark}>
                  <label htmlFor="lib-page">{formCopy.page}</label>
                  <input id="lib-page" type="number" min={1} step={1} value={page} onChange={(event) => setPage(event.target.value)} required />
                  <label htmlFor="lib-note">{formCopy.note}</label>
                  <input id="lib-note" value={note} onChange={(event) => setNote(event.target.value)} />
                  <button type="submit">{formCopy.saveBookmark}</button>
                </form>
              ) : null}
            </section>
          ) : null}
        </DataPanel>
      ) : null}

      {tab === 'revisions' ? (
        <DataPanel title={copy.tabs.libRevisions}>
          <p className="status">{formCopy.referenceHint}</p>
          <Autocomplete
            id="lib-family"
            options={documents}
            values={selectedId ? [selectedId] : []}
            placeholder={formCopy.reference}
            emptyLabel={copy.empty}
            onChange={(values) => setSelectedId(values[0] ?? null)}
          />
          <DataTable rows={family} columns={['code', 'edition', 'amendment', 'status']} locale={locale} onOpen={choose} />
        </DataPanel>
      ) : null}

      {tab === 'bookmarks' ? (
        <DataPanel title={copy.tabs.libBookmarks}>
          <DataTable rows={bookmarks} columns={['code', 'title', 'edition', 'page', 'note']} locale={locale} />
        </DataPanel>
      ) : null}

      <Modal open={open} title={formCopy.register} closeLabel={copy.cancel} onClose={() => setOpen(false)}>
        <form className="stack" onSubmit={submit}>
          <p className="status">{formCopy.publishHint}</p>
          <p className="status">{formCopy.referenceHint}</p>
          <label htmlFor="lib-code">{formCopy.code}</label>
          <input id="lib-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          <label htmlFor="lib-title">{copy.sms.titleLabel}</label>
          <input id="lib-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <label htmlFor="lib-category">{formCopy.category}</label>
          <Autocomplete
            id="lib-category"
            allowCustom
            options={categories}
            values={form.category ? [form.category] : []}
            placeholder={formCopy.category}
            emptyLabel={copy.empty}
            onChange={(values) => setForm({ ...form, category: values[0] ?? '' })}
          />
          <label htmlFor="lib-edition">{formCopy.edition}</label>
          <input id="lib-edition" value={form.edition} onChange={(event) => setForm({ ...form, edition: event.target.value })} required />
          <label htmlFor="lib-amendment">{formCopy.amendment}</label>
          <input id="lib-amendment" value={form.amendment} onChange={(event) => setForm({ ...form, amendment: event.target.value })} />
          <label htmlFor="lib-language">{formCopy.language}</label>
          <Autocomplete
            id="lib-language"
            allowCustom
            options={languages}
            values={form.language ? [form.language] : []}
            placeholder={formCopy.language}
            emptyLabel={copy.empty}
            onChange={(values) => setForm({ ...form, language: values[0] ?? '' })}
          />
          <label htmlFor="lib-reference">{formCopy.reference}</label>
          <input id="lib-reference" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
          <label htmlFor="lib-file">{formCopy.file}</label>
          <input id="lib-file" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <div className="magic-filters" role="group" aria-label={copy.flightsForm.status}>
            {statuses.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`magic-chip${form.status === value ? ' is-on' : ''}`}
                onClick={() => setForm({ ...form, status: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="submit" disabled={!form.category || !form.language}>
              {formCopy.register}
            </button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

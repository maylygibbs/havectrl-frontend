import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, MasterList, ModuleHero, ModuleTabs, StatusPill } from '../ui/ModuleChrome';
import { isPreviewableMime } from '../ui/file-preview';
import { Modal } from '../ui/Modal';
import { TableSearchBar } from '../ui/TableSearchBar';
import { filterRowsBySearch } from '../ui/table-filter';
import { DataTable, cellText } from '../ui/table';

export type AircraftDocumentForm = {
  title: string;
  status: string;
  expiresOn: string;
};

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  detail: Record<string, unknown> | null;
  documentForm: AircraftDocumentForm;
  showDocumentForm: boolean;
  editingDocumentId: string | null;
  onSelect: (id: string) => void;
  onDocumentFormChange: (form: AircraftDocumentForm) => void;
  onShowDocumentForm: (show: boolean) => void;
  onStartCreateDocument: () => void;
  onStartEditDocument: (row: Record<string, unknown>) => void;
  onSubmitDocument: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteDocument: (id: string) => void;
  fileRows: Record<string, unknown>[];
  onUploadFile: (file: File) => void;
  onDownloadFile: (id: string, name: string) => void;
  onPreviewFile: (id: string, name: string, mime: string) => void;
  onDeleteFile: (id: string) => void;
};

export function AircraftPage({
  locale,
  rows,
  detail,
  documentForm,
  showDocumentForm,
  editingDocumentId,
  onSelect,
  onDocumentFormChange,
  onShowDocumentForm,
  onStartCreateDocument,
  onStartEditDocument,
  onSubmitDocument,
  onDeleteDocument,
  fileRows,
  onUploadFile,
  onDownloadFile,
  onPreviewFile,
  onDeleteFile,
}: Props) {
  const copy = t(locale);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'overview' | 'documents' | 'discrepancies' | 'history'>('overview');
  const [documentSearch, setDocumentSearch] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const selectedId = detail ? String(detail.id) : rows[0] ? String(rows[0].id) : null;
  const documents = (detail?.documents as Record<string, unknown>[]) ?? [];
  const documentsVisible = useMemo(
    () => filterRowsBySearch(documents, documentSearch),
    [documents, documentSearch],
  );
  const filesVisible = useMemo(() => filterRowsBySearch(fileRows, fileSearch), [fileRows, fileSearch]);

  useEffect(() => {
    const first = rows[0];
    if (!detail && first && 'registration' in first) onSelect(String(first.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, detail?.id]);

  const items = useMemo(
    () =>
      rows.map((row) => ({
        id: String(row.id),
        title: String(row.registration ?? '—'),
        subtitle: String(row.model ?? '—'),
        status: String(row.technical_status ?? 'unknown'),
      })),
    [rows],
  );

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.aircraft}
        subtitle={copy.moduleSubs.aircraft}
        image="/heroes/hero-aircraft.png"
        meta={detail ? `${detail.model ?? ''} | ${detail.registration ?? ''}` : undefined}
      />
      <ModuleTabs
        tabs={[
          { id: 'overview', label: copy.tabs.aircraftOverview },
          { id: 'documents', label: copy.tabs.aircraftDocuments },
          { id: 'discrepancies', label: copy.tabs.aircraftDiscrepancies },
          { id: 'history', label: copy.tabs.aircraftHistory },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      <Modal
        open={showDocumentForm}
        title={editingDocumentId ? copy.aircraftForm.editDocument : copy.aircraftForm.newDocument}
        closeLabel={copy.cancel}
        onClose={() => onShowDocumentForm(false)}
      >
        <form className="stack" onSubmit={onSubmitDocument}>
          <label htmlFor="doc-title">{copy.aircraftForm.documentTitle}</label>
          <input
            id="doc-title"
            value={documentForm.title}
            onChange={(e) => onDocumentFormChange({ ...documentForm, title: e.target.value })}
            required
          />
          <label htmlFor="doc-status">{copy.aircraftForm.documentStatus}</label>
          <input
            id="doc-status"
            value={documentForm.status}
            onChange={(e) => onDocumentFormChange({ ...documentForm, status: e.target.value })}
            required
          />
          <label htmlFor="doc-expires">{copy.aircraftForm.documentExpires}</label>
          <input
            id="doc-expires"
            type="date"
            value={documentForm.expiresOn}
            onChange={(e) => onDocumentFormChange({ ...documentForm, expiresOn: e.target.value })}
          />
          <div className="actions">
            <button type="submit">{editingDocumentId ? copy.save : copy.create}</button>
            <button type="button" className="ghost" onClick={() => onShowDocumentForm(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      <div className="split-layout">
        <MasterList
          title={copy.sections.fleet}
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          empty={copy.empty}
          locale={locale}
        />
        <div className="split-main">
          {!detail ? (
            <p className="status">{copy.empty}</p>
          ) : tab === 'overview' ? (
            <DataPanel
              title={`${cellText(detail.registration)} · ${cellText(detail.model)}`}
              action={<StatusPill status={String(detail.technical_status ?? 'unknown')} />}
            >
              <div className="metric-grid metric-grid-4">
                <div className="metric-card static">
                  <span className="metric-label">{copy.columns.airframe_hours}</span>
                  <strong className="metric-value">{cellText(detail.airframe_hours)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.columns.airframe_cycles}</span>
                  <strong className="metric-value">{cellText(detail.airframe_cycles)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.columns.registration}</span>
                  <strong className="metric-value small">{cellText(detail.registration)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.columns.model}</span>
                  <strong className="metric-value small">{cellText(detail.model)}</strong>
                </div>
              </div>
            </DataPanel>
          ) : tab === 'documents' ? (
            <DataPanel
              title={copy.tabs.aircraftDocuments}
              action={
                <button type="button" className="ghost btn-compact" onClick={onStartCreateDocument}>
                  {copy.aircraftForm.newDocument}
                </button>
              }
            >
              <div className="table-stack">
                {documents.length > 0 ? (
                  <TableSearchBar locale={locale} value={documentSearch} onChange={setDocumentSearch} />
                ) : null}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{copy.aircraftForm.documentTitle}</th>
                      <th>{copy.aircraftForm.documentStatus}</th>
                      <th>{copy.aircraftForm.documentExpires}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <p className="status">{copy.empty}</p>
                        </td>
                      </tr>
                    ) : documentsVisible.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <p className="status">{copy.empty}</p>
                        </td>
                      </tr>
                    ) : (
                      documentsVisible.map((row) => (
                        <tr key={String(row.id)}>
                          <td>{cellText(row.title)}</td>
                          <td>{cellText(row.status)}</td>
                          <td>{cellText(row.expiry_date)}</td>
                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                className="ghost btn-compact"
                                onClick={() => onStartEditDocument(row)}
                              >
                                {copy.aircraftForm.editDocument}
                              </button>
                              <button
                                type="button"
                                className="ghost danger btn-compact"
                                onClick={() => onDeleteDocument(String(row.id))}
                              >
                                {copy.softDelete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
              <h3>{copy.files.attachments}</h3>
              <div className="module-toolbar">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUploadFile(file);
                    event.target.value = '';
                  }}
                />
                <button type="button" disabled={!detail} onClick={() => fileInputRef.current?.click()}>
                  {copy.files.upload}
                </button>
              </div>
              <div className="table-stack">
                {fileRows.length > 0 ? (
                  <TableSearchBar locale={locale} value={fileSearch} onChange={setFileSearch} />
                ) : null}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{copy.columns.name}</th>
                      <th>{copy.aircraftForm.documentStatus}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {fileRows.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <p className="status">{copy.files.empty}</p>
                        </td>
                      </tr>
                    ) : filesVisible.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <p className="status">{copy.empty}</p>
                        </td>
                      </tr>
                    ) : (
                      filesVisible.map((row) => (
                        <tr key={String(row.id)}>
                          <td>{cellText(row.original_name)}</td>
                          <td>{cellText(row.mime_type)}</td>
                          <td>
                            <div className="actions">
                              {isPreviewableMime(String(row.mime_type ?? '')) ? (
                                <button
                                  type="button"
                                  className="ghost btn-compact"
                                  onClick={() =>
                                    onPreviewFile(
                                      String(row.id),
                                      String(row.original_name ?? 'file'),
                                      String(row.mime_type ?? ''),
                                    )
                                  }
                                >
                                  {copy.files.preview}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="ghost btn-compact"
                                onClick={() => onDownloadFile(String(row.id), String(row.original_name ?? 'file'))}
                              >
                                {copy.files.download}
                              </button>
                              <button
                                type="button"
                                className="ghost danger btn-compact"
                                onClick={() => onDeleteFile(String(row.id))}
                              >
                                {copy.softDelete}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </DataPanel>
          ) : tab === 'discrepancies' ? (
            <DataPanel title={copy.tabs.aircraftDiscrepancies}>
              <DataTable
                rows={(detail.discrepancies as Record<string, unknown>[]) ?? []}
                columns={['title', 'status', 'reported_by', 'description']}
                locale={locale}
              />
            </DataPanel>
          ) : (
            <DataPanel title={copy.tabs.aircraftHistory}>
              <DataTable
                rows={(detail.flights as Record<string, unknown>[]) ?? []}
                columns={['code', 'origin', 'destination', 'status', 'flight_date']}
                locale={locale}
              />
            </DataPanel>
          )}
        </div>
      </div>
    </div>
  );
}

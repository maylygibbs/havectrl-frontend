import { FormEvent, useMemo, useRef, useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { Autocomplete } from '../ui/Autocomplete';
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

export type AircraftForm = {
  registration: string;
  model: string;
  serialNumber: string;
  base: string;
  technicalStatus: string;
  airframeHours: string;
  airframeCycles: string;
};

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
  detail: Record<string, unknown> | null;
  aircraftForm: AircraftForm;
  showAircraftForm: boolean;
  editingAircraftId: string | null;
  onAircraftFormChange: (form: AircraftForm) => void;
  onShowAircraftForm: (show: boolean) => void;
  onStartCreateAircraft: () => void;
  onStartEditAircraft: (row: Record<string, unknown>) => void;
  onSubmitAircraft: (event: FormEvent<HTMLFormElement>) => void;
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
  aircraftForm,
  showAircraftForm,
  editingAircraftId,
  onAircraftFormChange,
  onShowAircraftForm,
  onStartCreateAircraft,
  onStartEditAircraft,
  onSubmitAircraft,
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
  const selectedId = detail ? String(detail.id) : null;
  const documents = (detail?.documents as Record<string, unknown>[]) ?? [];
  const documentsVisible = useMemo(
    () => filterRowsBySearch(documents, documentSearch),
    [documents, documentSearch],
  );
  const filesVisible = useMemo(() => filterRowsBySearch(fileRows, fileSearch), [fileRows, fileSearch]);

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
      {tab === 'overview' ? (
        <div className="module-toolbar">
          <button type="button" onClick={onStartCreateAircraft}>
            {copy.aircraftForm.newAircraft}
          </button>
        </div>
      ) : null}

      <Modal
        open={showAircraftForm}
        title={editingAircraftId ? copy.aircraftForm.editAircraft : copy.aircraftForm.newAircraft}
        closeLabel={copy.cancel}
        onClose={() => onShowAircraftForm(false)}
      >
        <form className="stack" onSubmit={onSubmitAircraft}>
          <p className="status">{copy.aircraftForm.notAirworthy}</p>
          <label htmlFor="ac-registration">{copy.aircraftForm.registration}</label>
          <input id="ac-registration" value={aircraftForm.registration} onChange={(e) => onAircraftFormChange({ ...aircraftForm, registration: e.target.value })} required />
          <label htmlFor="ac-model">{copy.aircraftForm.model}</label>
          <Autocomplete
            id="ac-model"
            allowCustom
            options={[...new Set(rows.map((row) => String(row.model ?? '')).filter(Boolean))].map((value) => ({ value, label: value }))}
            values={aircraftForm.model ? [aircraftForm.model] : []}
            placeholder={copy.aircraftForm.model}
            emptyLabel={copy.empty}
            onChange={(values) => onAircraftFormChange({ ...aircraftForm, model: values[0] ?? '' })}
          />
          <label htmlFor="ac-serial">{copy.aircraftForm.serial}</label>
          <input id="ac-serial" value={aircraftForm.serialNumber} onChange={(e) => onAircraftFormChange({ ...aircraftForm, serialNumber: e.target.value })} required />
          <label htmlFor="ac-base">{copy.aircraftForm.base}</label>
          <Autocomplete
            id="ac-base"
            allowCustom
            options={[...new Set(rows.map((row) => String(row.base ?? '')).filter(Boolean))].map((value) => ({ value, label: value }))}
            values={aircraftForm.base ? [aircraftForm.base] : []}
            placeholder={copy.aircraftForm.base}
            emptyLabel={copy.empty}
            onChange={(values) => onAircraftFormChange({ ...aircraftForm, base: values[0] ?? '' })}
          />
          <span id="ac-status">{copy.aircraftForm.technicalStatus}</span>
          <div className="magic-filters" role="group" aria-labelledby="ac-status">
            {(
              [
                ['unknown', copy.aircraftForm.statusUnknown],
                ['in_service', copy.aircraftForm.statusInService],
                ['in_maintenance', copy.aircraftForm.statusInMaintenance],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`magic-chip${aircraftForm.technicalStatus === value ? ' is-on' : ''}`}
                onClick={() => onAircraftFormChange({ ...aircraftForm, technicalStatus: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="status">{copy.aircraftForm.hoursHint}</p>
          <label htmlFor="ac-hours">{copy.aircraftForm.hours}</label>
          <input id="ac-hours" type="number" min="0" step="0.1" value={aircraftForm.airframeHours} onChange={(e) => onAircraftFormChange({ ...aircraftForm, airframeHours: e.target.value })} />
          <label htmlFor="ac-cycles">{copy.aircraftForm.cycles}</label>
          <input id="ac-cycles" type="number" min="0" step="1" value={aircraftForm.airframeCycles} onChange={(e) => onAircraftFormChange({ ...aircraftForm, airframeCycles: e.target.value })} />
          <div className="actions">
            <button type="submit" disabled={!aircraftForm.model || !aircraftForm.base}>
              {editingAircraftId ? copy.save : copy.aircraftForm.newAircraft}
            </button>
            <button type="button" className="ghost" onClick={() => onShowAircraftForm(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

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
          <span id="doc-status">{copy.aircraftForm.documentStatus}</span>
          <div className="magic-filters" role="group" aria-labelledby="doc-status">
            {(
              [
                ['valid', copy.aircraftForm.docValid],
                ['expiring', copy.aircraftForm.docExpiring],
                ['expired', copy.aircraftForm.docExpired],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`magic-chip${documentForm.status === value ? ' is-on' : ''}`}
                onClick={() => onDocumentFormChange({ ...documentForm, status: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor="doc-expires">{copy.aircraftForm.documentExpires}</label>
          <input
            id="doc-expires"
            type="date"
            value={documentForm.expiresOn}
            onChange={(e) => onDocumentFormChange({ ...documentForm, expiresOn: e.target.value })}
          />
          <div className="actions">
            <button type="submit">{editingDocumentId ? copy.save : copy.aircraftForm.createDocument}</button>
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
              action={
                <button type="button" className="ghost btn-compact" onClick={() => onStartEditAircraft(detail)}>
                  {copy.aircraftForm.editAircraft}
                </button>
              }
            >
              <p className="status">{copy.aircraftForm.notAirworthy}</p>
              <div className="metric-grid metric-grid-4">
                <div className="metric-card static">
                  <span className="metric-label">{copy.aircraftForm.serial}</span>
                  <strong className="metric-value small">{cellText(detail.serial_number)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.aircraftForm.base}</span>
                  <strong className="metric-value small">{cellText(detail.base)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.aircraftForm.hours}</span>
                  <strong className="metric-value">{detail.airframe_hours == null || detail.airframe_hours === '' ? '—' : cellText(detail.airframe_hours)}</strong>
                </div>
                <div className="metric-card static">
                  <span className="metric-label">{copy.aircraftForm.cycles}</span>
                  <strong className="metric-value">{detail.airframe_cycles == null || detail.airframe_cycles === '' ? '—' : cellText(detail.airframe_cycles)}</strong>
                </div>
              </div>
              <p>
                <StatusPill status={String(detail.technical_status ?? 'unknown')} />
              </p>
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

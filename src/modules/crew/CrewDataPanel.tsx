import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { StatusPill } from '../../ui/ModuleChrome';
import { TableSearchBar } from '../../ui/TableSearchBar';
import { cellText } from '../../ui/table';
import { filterRowsBySearch } from '../../ui/table-filter';
import { isPreviewableMime } from '../../ui/file-preview';
import { crewInitials } from './crew-utils';

type DocRow = Record<string, unknown>;

type Props = {
  locale: Locale;
  detail: Record<string, unknown>;
  onEdit: () => void;
  onEditLicenses: () => void;
  onEditMedical: () => void;
  onDeactivate: () => void;
  onAddDocument: (category: string) => void;
  onEditDocument: (row: DocRow) => void;
  onDeleteDocument: (id: string) => void;
  onReviewDocument: (id: string, decision: 'accept' | 'reject') => void;
  fileRows: DocRow[];
  onUploadFile: (file: File) => void;
  onDownloadFile: (id: string, name: string) => void;
  onPreviewFile: (id: string, name: string, mime: string) => void;
  onDeleteFile: (id: string) => void;
};

const DOC_CATEGORIES = ['license', 'instructor', 'medical', 'language', 'travel', 'uniform', 'training', 'other'] as const;

export function CrewDataPanel({
  locale,
  detail,
  onEdit,
  onEditLicenses,
  onEditMedical,
  onDeactivate,
  onAddDocument,
  onEditDocument,
  onDeleteDocument,
  onReviewDocument,
  fileRows,
  onUploadFile,
  onDownloadFile,
  onPreviewFile,
  onDeleteFile,
}: Props) {
  const copy = t(locale);
  const name = String(detail.full_name ?? '—');
  const documents = (detail.documents as DocRow[] | undefined) ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="crew-data-panel">
      <header className="crew-profile-header">
        <span className="crew-avatar crew-avatar-lg" aria-hidden="true">
          {crewInitials(name)}
        </span>
        <div className="crew-profile-title">
          <h2>{name}</h2>
          <p>
            {cellText(detail.employee_code)} · {cellText(detail.position)} · {cellText(detail.base)}
          </p>
          <StatusPill status={String(detail.status ?? 'active')} />
        </div>
        <div className="actions crew-profile-actions">
          <button type="button" className="ghost btn-compact" onClick={onEdit}>
            {copy.crew.edit}
          </button>
          <button type="button" className="ghost danger btn-compact" onClick={onDeactivate}>
            {copy.softDelete}
          </button>
        </div>
      </header>

      <div className="crew-data-sections">
        {DOC_CATEGORIES.map((cat) => (
          <DocumentCategorySection
            key={cat}
            locale={locale}
            sectionTitle={
              cat === 'license'
                ? copy.crew.sections.licenses
                : cat === 'other'
                  ? copy.crew.sections.otherDocs
                  : copy.crew.sections[cat]
            }
            rows={documents.filter((d) => String(d.category) === cat)}
            onAdd={() => onAddDocument(cat)}
            onEdit={onEditDocument}
            onDelete={onDeleteDocument}
            onReview={onReviewDocument}
            defaultOpen={cat === 'license' || cat === 'medical'}
            summary={
              cat === 'license' ? (
                <FieldGrid
                  fields={[
                    [copy.crew.licenseNumber, detail.license_number],
                    [copy.crew.licenseExpires, detail.license_expires],
                  ]}
                />
              ) : cat === 'medical' ? (
                <FieldGrid
                  fields={[
                    [copy.crew.medicalExpires, detail.medical_expires],
                    [
                      copy.crew.medicalFit,
                      detail.medical_fit === null ? '—' : detail.medical_fit ? copy.crew.medicalFitYes : copy.crew.medicalFitNo,
                    ],
                  ]}
                />
              ) : null
            }
            extra={
              cat === 'license' ? (
                <button type="button" className="ghost btn-compact" onClick={onEditLicenses}>
                  {copy.crew.editLicenses}
                </button>
              ) : cat === 'medical' ? (
                <button type="button" className="ghost btn-compact" onClick={onEditMedical}>
                  {copy.crew.editMedical}
                </button>
              ) : null
            }
          />
        ))}

        <CrewSection title={copy.crew.sections.personalInfo}>
          <FieldGrid
            fields={[
              [copy.crew.fullName, detail.full_name],
              [copy.crew.employeeCode, detail.employee_code],
              [copy.email, detail.email],
              [copy.crew.status, detail.status],
            ]}
          />
        </CrewSection>

        <CrewSection title={copy.crew.sections.employment}>
          <FieldGrid
            fields={[
              [copy.crew.position, detail.position],
              [copy.crew.base, detail.base],
              [copy.crew.team, detail.team],
              [copy.crew.accessRole, detail.access_role ?? '—'],
            ]}
          />
        </CrewSection>

        <CrewSection title={copy.crew.sections.uniform}>
          <FieldGrid
            fields={[
              [copy.crew.shirt, detail.uniform_shirt],
              [copy.crew.pants, detail.uniform_pants],
              [copy.crew.shoes, detail.uniform_shoes],
            ]}
          />
        </CrewSection>

        <CrewSection title={copy.files.attachments} defaultOpen={false}>
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
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              {copy.files.upload}
            </button>
          </div>
          <CrewFileTable
            locale={locale}
            rows={fileRows}
            onDownload={onDownloadFile}
            onPreview={onPreviewFile}
            onDelete={onDeleteFile}
          />
        </CrewSection>
      </div>
    </div>
  );
}

function DocumentCategorySection({
  locale,
  sectionTitle,
  rows,
  onAdd,
  onEdit,
  onDelete,
  onReview,
  defaultOpen,
  summary,
  extra,
}: {
  locale: Locale;
  sectionTitle: string;
  rows: DocRow[];
  onAdd: () => void;
  onEdit: (row: DocRow) => void;
  onDelete: (id: string) => void;
  onReview: (id: string, decision: 'accept' | 'reject') => void;
  defaultOpen?: boolean;
  summary?: ReactNode;
  extra?: ReactNode;
}) {
  const copy = t(locale);
  return (
    <CrewSection title={sectionTitle} defaultOpen={defaultOpen}>
      {summary}
      <div className="crew-section-toolbar">
        {extra}
        <button type="button" className="ghost btn-compact" onClick={onAdd}>
          {copy.crew.addDocument}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="status crew-section-empty">{copy.crew.noDocumentsInSection}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table crew-doc-table">
            <thead>
              <tr>
                <th>{copy.columns.title}</th>
                <th>{copy.crew.documentNumber}</th>
                <th>{copy.crew.issuer}</th>
                <th>{copy.crew.documentExpires}</th>
                <th>{copy.crew.review}</th>
                <th>{copy.crew.validity}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{cellText(row.title)}</td>
                  <td>{cellText(row.document_number)}</td>
                  <td>{cellText(row.issuer)}</td>
                  <td>{cellText(row.expires_on)}</td>
                  <td>{cellText(row.review_status)}</td>
                  <td>{cellText(row.validity)}</td>
                  <td>
                    <div className="actions">
                      {String(row.review_status) === 'pending_review' ? (
                        <>
                          <button type="button" className="ghost btn-compact" onClick={() => onReview(String(row.id), 'accept')}>
                            {copy.crew.accept}
                          </button>
                          <button type="button" className="ghost btn-compact" onClick={() => onReview(String(row.id), 'reject')}>
                            {copy.crew.reject}
                          </button>
                        </>
                      ) : null}
                      <button type="button" className="ghost btn-compact" onClick={() => onEdit(row)}>
                        {copy.aircraftForm.editDocument}
                      </button>
                      <button
                        type="button"
                        className="ghost danger btn-compact"
                        onClick={() => onDelete(String(row.id))}
                      >
                        {copy.softDelete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CrewSection>
  );
}

function CrewFileTable({
  locale,
  rows,
  onDownload,
  onPreview,
  onDelete,
}: {
  locale: Locale;
  rows: DocRow[];
  onDownload: (id: string, name: string) => void;
  onPreview: (id: string, name: string, mime: string) => void;
  onDelete: (id: string) => void;
}) {
  const copy = t(locale);
  const [search, setSearch] = useState('');
  const visible = useMemo(() => filterRowsBySearch(rows, search), [rows, search]);

  return (
    <>
      {rows.length > 0 ? <TableSearchBar locale={locale} value={search} onChange={setSearch} /> : null}
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <p className="status">{copy.files.empty}</p>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <p className="status">{copy.empty}</p>
                </td>
              </tr>
            ) : (
              visible.map((row) => (
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
                            onPreview(String(row.id), String(row.original_name ?? 'file'), String(row.mime_type ?? ''))
                          }
                        >
                          {copy.files.preview}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="ghost btn-compact"
                        onClick={() => onDownload(String(row.id), String(row.original_name ?? 'file'))}
                      >
                        {copy.files.download}
                      </button>
                      <button
                        type="button"
                        className="ghost danger btn-compact"
                        onClick={() => onDelete(String(row.id))}
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
    </>
  );
}

function CrewSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="crew-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="crew-section-body">{children}</div>
    </details>
  );
}

function FieldGrid({ fields }: { fields: [string, unknown][] }) {
  return (
    <dl className="crew-field-grid">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{cellText(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

import { useEffect, useState } from 'react';
import { fetchStoredFileBlob } from '../api';
import { Locale, t } from '../i18n/catalog';
import { Modal } from './Modal';
import { previewKind } from './file-preview';

type Props = {
  locale: Locale;
  open: boolean;
  token: string;
  fileId: string | null;
  fileName: string;
  mimeType: string;
  onClose: () => void;
  onDownload: () => void;
};

export function FilePreviewModal({
  locale,
  open,
  token,
  fileId,
  fileName,
  mimeType,
  onClose,
  onDownload,
}: Props) {
  const copy = t(locale);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const kind = previewKind(mimeType);

  useEffect(() => {
    if (!open || !fileId) {
      setBlobUrl(null);
      setError('');
      return;
    }
    if (kind === 'none') {
      setLoading(false);
      setBlobUrl(null);
      setError('');
      return;
    }
    let revoke: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError('');
    void fetchStoredFileBlob(fileId, token)
      .then(({ url }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoke = url;
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
      setBlobUrl(null);
    };
  }, [open, fileId, token, kind]);

  return (
    <Modal
      open={open}
      title={fileName || copy.files.preview}
      closeLabel={copy.cancel}
      onClose={onClose}
      dialogClassName="modal-dialog-wide"
    >
      {loading ? <p className="status">{copy.files.loadingPreview}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && blobUrl && kind === 'image' ? (
        <div className="file-preview-body">
          <img className="file-preview-img" src={blobUrl} alt={fileName} />
        </div>
      ) : null}
      {!loading && !error && blobUrl && kind === 'pdf' ? (
        <iframe className="file-preview-frame" title={fileName} src={blobUrl} />
      ) : null}
      {!loading && !error && kind === 'none' ? (
        <p className="status">{copy.files.previewUnsupported}</p>
      ) : null}
      <div className="actions file-preview-actions">
        <button type="button" onClick={onDownload}>
          {copy.files.download}
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          {copy.cancel}
        </button>
      </div>
    </Modal>
  );
}

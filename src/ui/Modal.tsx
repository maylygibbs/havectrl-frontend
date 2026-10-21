import { ReactNode, useEffect, useId } from 'react';

type Props = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  dialogClassName?: string;
  children: ReactNode;
};

export function Modal({ open, title, closeLabel, onClose, dialogClassName, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root" role="presentation" onClick={onClose}>
      <div
        className={dialogClassName ? `modal-dialog panel-light ${dialogClassName}` : 'modal-dialog panel-light'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="ghost btn-compact modal-close" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

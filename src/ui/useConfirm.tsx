import { useCallback, useRef, useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

type ConfirmUi = ConfirmOptions;

export function useConfirm() {
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const [ui, setUi] = useState<ConfirmUi | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setUi(options);
    });
  }, []);

  const finish = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setUi(null);
  }, []);

  const dialog = ui ? (
    <ConfirmModal
      open
      title={ui.title}
      message={ui.message}
      confirmLabel={ui.confirmLabel}
      cancelLabel={ui.cancelLabel}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ) : null;

  return { confirm, dialog };
}

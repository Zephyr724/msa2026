import { useEffect, useRef, type ReactNode } from 'react';
import { playUiSound } from '../../lib/uiSounds.ts';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  positive?: boolean;
  pending: boolean;
  error?: string | null;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = 'Keep quest',
  destructive = false,
  positive = false,
  pending,
  error,
  children,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const safeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      safeButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      returnFocusRef.current?.focus();
    }
    return () => {
      if (open) returnFocusRef.current?.focus();
    };
  }, [open]);

  function closeDialog() {
    if (pending) return;
    playUiSound('cancel');
    onClose();
  }

  function confirmDialog() {
    playUiSound('confirm');
    onConfirm();
  }

  return (
    <dialog
      aria-labelledby="confirm-action-title"
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      ref={dialogRef}
    >
      <div className="modal-box max-w-lg rounded-[1.75rem] border border-base-300">
        <h2 className="text-2xl" id="confirm-action-title">
          {title}
        </h2>
        <p className="mt-3 text-muted-content">{description}</p>
        {children}
        {error && (
          <div className="alert alert-error mt-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            disabled={pending}
            onClick={closeDialog}
            ref={safeButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`btn ${destructive ? 'btn-error' : positive ? 'btn-success' : 'btn-primary'}`}
            disabled={pending}
            onClick={confirmDialog}
            type="button"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

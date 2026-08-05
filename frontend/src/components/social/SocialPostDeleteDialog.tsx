import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, type MouseEvent } from 'react';

interface SocialPostDeleteDialogProps {
  postId: string;
  open: boolean;
  pending: boolean;
  error: string | null;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SocialPostDeleteDialog({
  postId,
  open,
  pending,
  error,
  title,
  onClose,
  onConfirm,
}: SocialPostDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = `delete-social-post-${postId}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  function close() {
    if (!pending) onClose();
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="modal bg-black/55 backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) close();
      }}
      ref={dialogRef}
    >
      <div className="modal-box max-w-md rounded-[1.75rem] border border-base-300">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kiwi-stat-label text-error">Permanent action</p>
            <h2 className="mt-1 text-2xl" id={titleId}>Delete this post?</h2>
          </div>
          <button aria-label="Close delete dialog" className="btn btn-ghost btn-sm btn-square" disabled={pending} onClick={close} type="button">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-content">
          “{title}” and all of its likes and comments will be permanently removed.
        </p>
        {error && <p className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">{error}</p>}
        <div className="modal-action">
          <button className="btn btn-ghost" disabled={pending} onClick={close} ref={cancelRef} type="button">Keep post</button>
          <button className="btn btn-error" disabled={pending} onClick={onConfirm} type="button">
            <Trash2 aria-hidden="true" className="size-4" />
            {pending ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

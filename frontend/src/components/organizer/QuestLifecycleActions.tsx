import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useArchiveQuestMutation,
  useCancelQuestMutation,
  useDeleteQuestMutation,
  usePublishQuestMutation,
} from '../../hooks/useOrganizerQuests';
import { ApiError } from '../../lib/api/apiFetch';
import type { QuestStatus } from '../../types/questManagement';
import ConfirmActionDialog from './ConfirmActionDialog';

type Action = 'publish' | 'cancel' | 'archive' | 'delete';

const ACTION_COPY: Record<Action, {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
}> = {
  publish: {
    title: 'Publish this quest?',
    description: 'Publishing makes this quest visible in the public quest list.',
    confirmLabel: 'Publish quest',
    pendingLabel: 'Publishing…',
  },
  cancel: {
    title: 'Cancel this quest?',
    description: 'Cancelling removes this quest from public discovery and affects participants.',
    confirmLabel: 'Cancel quest',
    pendingLabel: 'Cancelling…',
  },
  archive: {
    title: 'Archive this quest?',
    description: 'Archived quests are retained as read-only management history.',
    confirmLabel: 'Archive quest',
    pendingLabel: 'Archiving…',
  },
  delete: {
    title: 'Delete this draft?',
    description: 'This permanently deletes the draft and its images. This cannot be undone.',
    confirmLabel: 'Delete draft',
    pendingLabel: 'Deleting…',
  },
};

interface QuestLifecycleActionsProps {
  quest: { id: string; status: QuestStatus; version: number };
  disabled?: boolean;
  onSuccessMessage?: (message: string) => void;
  onForbidden?: () => void;
}

export default function QuestLifecycleActions({
  quest,
  disabled = false,
  onSuccessMessage,
  onForbidden,
}: QuestLifecycleActionsProps) {
  const navigate = useNavigate();
  const publish = usePublishQuestMutation();
  const cancel = useCancelQuestMutation();
  const archive = useArchiveQuestMutation();
  const remove = useDeleteQuestMutation();
  const [action, setAction] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmParticipants, setConfirmParticipants] = useState(false);

  const pending = publish.isPending || cancel.isPending || archive.isPending || remove.isPending;

  function openAction(nextAction: Action) {
    setActionError(null);
    setConfirmParticipants(false);
    setAction(nextAction);
  }

  function closeAction() {
    setAction(null);
    setActionError(null);
    setConfirmParticipants(false);
  }

  async function confirmAction() {
    if (!action) return;
    try {
      if (action === 'publish') {
        await publish.mutateAsync({ id: quest.id, version: quest.version });
      } else if (action === 'cancel') {
        await cancel.mutateAsync({
          id: quest.id,
          version: quest.version,
          confirmActiveParticipants: confirmParticipants,
        });
      } else if (action === 'archive') {
        await archive.mutateAsync({ id: quest.id, version: quest.version });
      } else {
        await remove.mutateAsync({ id: quest.id, version: quest.version });
      }

      const completedAction = action;
      closeAction();
      onSuccessMessage?.(
        completedAction === 'publish' ? 'Quest published successfully.'
          : completedAction === 'cancel' ? 'Quest cancelled successfully.'
            : completedAction === 'archive' ? 'Quest archived successfully.'
              : 'Draft deleted.',
      );
      if (completedAction === 'delete') {
        navigate('/organizer/quests');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        closeAction();
        onForbidden?.();
        return;
      }
      setActionError(
        error instanceof ApiError
          ? error.problem?.detail ?? 'The quest action could not be completed.'
          : 'The quest action could not be completed. Please try again.',
      );
    }
  }

  const availableActions: Action[] = quest.status === 'Draft'
    ? ['publish', 'delete']
    : quest.status === 'Published'
      ? ['cancel', 'archive']
      : quest.status === 'Cancelled'
        ? ['archive']
        : [];

  if (availableActions.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((availableAction) => (
          <button
            className={availableAction === 'delete' ? 'btn btn-error btn-sm' : 'btn btn-outline btn-sm'}
            disabled={disabled || pending}
            key={availableAction}
            onClick={() => openAction(availableAction)}
            type="button"
          >
            {ACTION_COPY[availableAction].confirmLabel}
          </button>
        ))}
      </div>
      {action && (
        <ConfirmActionDialog
          confirmLabel={ACTION_COPY[action].confirmLabel}
          description={ACTION_COPY[action].description}
          error={actionError}
          onClose={closeAction}
          onConfirm={confirmAction}
          open
          pending={pending}
          pendingLabel={ACTION_COPY[action].pendingLabel}
          title={ACTION_COPY[action].title}
        >
          {action === 'cancel' && (
            <label className="label mt-4 cursor-pointer justify-start gap-3">
              <input
                checked={confirmParticipants}
                className="checkbox checkbox-warning"
                disabled={pending}
                onChange={(event) => setConfirmParticipants(event.target.checked)}
                type="checkbox"
              />
              <span>I acknowledge the impact on active participants.</span>
            </label>
          )}
        </ConfirmActionDialog>
      )}
    </>
  );
}

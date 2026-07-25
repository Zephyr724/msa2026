import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../../hooks/useAuth';
import {
  useCancelQuestParticipationMutation,
  useJoinQuestMutation,
  useMyQuestParticipationQuery,
} from '../../hooks/useParticipation';
import { ApiError } from '../../lib/api/apiFetch';
import type { QuestRegistrationMode } from '../../types/quest';

interface QuestParticipationPanelProps {
  questId: string;
  registrationMode: QuestRegistrationMode | null;
}

export default function QuestParticipationPanel({
  questId,
  registrationMode,
}: QuestParticipationPanelProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const auth = useAuthQuery();
  const participation = useMyQuestParticipationQuery(questId);
  const join = useJoinQuestMutation(questId);
  const cancel = useCancelQuestParticipationMutation(questId);
  const mutationPending = join.isPending || cancel.isPending;
  const mutationError = join.error ?? cancel.error;

  async function handleJoin() {
    if (mutationPending || !participation.data?.canJoin) return;
    try {
      await join.mutateAsync();
    } catch {
      // The authoritative server error is rendered below.
    }
  }

  async function handleCancel() {
    if (mutationPending) return;
    try {
      await cancel.mutateAsync();
      setConfirmingCancel(false);
    } catch {
      // The authoritative server error is rendered below.
    }
  }

  if (auth.isPending) {
    return <ParticipationShell><p aria-live="polite">Checking participation availability…</p></ParticipationShell>;
  }

  if (!auth.data) {
    if (registrationMode !== 'Native') return null;
    return (
      <ParticipationShell>
        <p>Sign in to join this quest.</p>
        <Link className="btn btn-success w-full sm:w-auto" to="/login">
          Sign in to join
        </Link>
      </ParticipationShell>
    );
  }

  if (participation.isPending) {
    return <ParticipationShell><p aria-live="polite">Loading your participation…</p></ParticipationShell>;
  }

  if (participation.isError || !participation.data) {
    return (
      <ParticipationShell>
        <p role="alert">We could not load your participation state.</p>
        <button
          className="btn btn-outline w-full sm:w-auto"
          onClick={() => participation.refetch()}
          type="button"
        >
          Retry participation
        </button>
      </ParticipationShell>
    );
  }

  const state = participation.data;

  return (
    <ParticipationShell>
      {state.status === 'Active' ? (
        <div className="space-y-3">
          <p className="font-semibold text-success" role="status">You have joined this Quest.</p>
          {confirmingCancel ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
              <p className="mb-3">Cancel your participation? You can rejoin later if space remains.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  aria-busy={cancel.isPending}
                  className="btn btn-warning w-full sm:w-auto"
                  disabled={mutationPending}
                  onClick={handleCancel}
                  type="button"
                >
                  {cancel.isPending ? 'Cancelling…' : 'Confirm cancellation'}
                </button>
                <button
                  className="btn btn-ghost w-full sm:w-auto"
                  disabled={mutationPending}
                  onClick={() => setConfirmingCancel(false)}
                  type="button"
                >
                  Keep participation
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-outline w-full sm:w-auto"
              disabled={mutationPending}
              onClick={() => setConfirmingCancel(true)}
              type="button"
            >
              Cancel participation
            </button>
          )}
        </div>
      ) : state.ineligibilityReason === 'OwnQuest' ? (
        <p className="font-medium">
          You created this Quest, so you cannot join it as a participant.
        </p>
      ) : state.capacityFull ? (
        <p className="font-medium">Quest is full. No participant count is shown.</p>
      ) : state.canJoin && registrationMode === 'Native' ? (
        <div className="space-y-3">
          {state.status === 'Cancelled' && (
            <p>You previously cancelled. You can join again while space remains.</p>
          )}
          <button
            aria-busy={join.isPending}
            className="btn btn-success w-full sm:w-auto"
            disabled={mutationPending}
            onClick={handleJoin}
            type="button"
          >
            {join.isPending ? 'Joining…' : state.status === 'Cancelled' ? 'Join again' : 'Join Quest'}
          </button>
        </div>
      ) : (
        <p>{ineligibilityMessage(state.ineligibilityReason, registrationMode)}</p>
      )}

      {mutationError && (
        <p className="mt-3 text-error" role="alert">
          {errorMessage(mutationError)}
        </p>
      )}
    </ParticipationShell>
  );
}

function ParticipationShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="participation-heading"
      className="mb-6 rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6"
    >
      <h2 className="mb-3 text-xl font-semibold" id="participation-heading">
        Your participation
      </h2>
      {children}
    </section>
  );
}

function ineligibilityMessage(
  reason: string | null,
  registrationMode: QuestRegistrationMode | null,
): string {
  if (reason === 'RegistrationModeNotSupported' || registrationMode !== 'Native') {
    return registrationMode === 'External'
      ? 'Registration is managed by the original event provider.'
      : 'This Quest does not require Kiwimpact registration.';
  }
  if (reason === 'QuestEnded') return 'This Quest has ended and can no longer be joined.';
  if (reason === 'QuestNotPublished') return 'This Quest is no longer open for participation.';
  if (reason === 'AlreadyParticipating') return 'You have already joined this Quest.';
  return 'This Quest is not currently available to join.';
}

function errorMessage(error: Error): string {
  if (error instanceof ApiError && error.problem?.detail) return error.problem.detail;
  return 'The participation request failed. Please try again.';
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../../hooks/useAuth';
import { useMyQuestCompletionQuery, useRedeemCompletionCode } from '../../hooks/useCompletion';
import { useMyQuestParticipationQuery } from '../../hooks/useParticipation';
import { ApiError } from '../../lib/api/apiFetch';
import { NORMALIZED_COMPLETION_CODE_PATTERN } from '../../types/completion';
import type { QuestRegistrationMode } from '../../types/quest';

const INVALID_COMPLETION_CODE_TYPE =
  'https://kiwimpact.app/problems/invalid-completion-code';

interface QuestCompletionPanelProps {
  questId: string;
  registrationMode: QuestRegistrationMode | null;
}

/**
 * Participant Completion Code redemption and completion state (Slice 4B).
 * The entered code lives only in component state and is cleared on success;
 * completion state is always rendered from the authoritative server Query,
 * never from local redemption optimism. No XP, reward, or level UI here.
 */
export default function QuestCompletionPanel({
  questId,
  registrationMode,
}: QuestCompletionPanelProps) {
  const auth = useAuthQuery();
  const participation = useMyQuestParticipationQuery(questId);
  const completion = useMyQuestCompletionQuery(questId);
  const redeem = useRedeemCompletionCode(questId);
  const [codeInput, setCodeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const normalized = codeInput.trim().toUpperCase().replace(/[-\s]/g, '');
    if (!NORMALIZED_COMPLETION_CODE_PATTERN.test(normalized)) {
      setValidationError('Enter the 10-character code from your Quest organizer.');
      setSubmitError(null);
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    setPending(true);
    try {
      await redeem(normalized);
      // The entered code leaves component memory; the Verified state below is
      // rendered from the refetched authoritative Query, not from this result.
      setCodeInput('');
    } catch (error) {
      setSubmitError(redeemErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  // Completion codes apply only to natively registered Quests; for other
  // modes the participation area already explains registration.
  if (registrationMode !== 'Native') return null;

  if (auth.isPending) {
    return (
      <CompletionShell>
        <p aria-live="polite">Checking completion availability…</p>
      </CompletionShell>
    );
  }

  if (!auth.data) {
    return (
      <CompletionShell>
        <p>Sign in to redeem a completion code.</p>
        <Link className="btn btn-success w-full sm:w-auto" to="/login">
          Sign in
        </Link>
      </CompletionShell>
    );
  }

  if (participation.isPending || completion.isPending) {
    return (
      <CompletionShell>
        <p aria-live="polite">Loading your completion state…</p>
      </CompletionShell>
    );
  }

  const loadError = participation.error ?? completion.error;
  if (participation.isError || completion.isError || !participation.data || !completion.data) {
    if (loadError instanceof ApiError && loadError.status === 401) {
      return (
        <CompletionShell>
          <p role="alert">Your session has expired. Sign in again to continue.</p>
          <Link className="btn btn-primary w-full sm:w-auto" to="/login">
            Sign in
          </Link>
        </CompletionShell>
      );
    }
    return (
      <CompletionShell>
        <p role="alert">We could not load your completion state.</p>
        <button
          className="btn btn-outline w-full sm:w-auto"
          onClick={() => {
            void participation.refetch();
            void completion.refetch();
          }}
          type="button"
        >
          Retry
        </button>
      </CompletionShell>
    );
  }

  if (completion.data.status === 'Verified') {
    return (
      <CompletionShell>
        <p className="font-semibold text-success" role="status">
          Quest completed. Nice work!
        </p>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">Completed</dt>
            <dd>{formatTimestamp(completion.data.completedAtUtc)}</dd>
          </div>
          <div>
            <dt className="font-medium">Verified</dt>
            <dd>{formatTimestamp(completion.data.verifiedAtUtc)}</dd>
          </div>
        </dl>
      </CompletionShell>
    );
  }

  if (participation.data.ineligibilityReason === 'OwnQuest') {
    return (
      <CompletionShell>
        <p className="font-medium">
          You created this Quest, so you cannot complete it with a code.
        </p>
      </CompletionShell>
    );
  }

  if (participation.data.status !== 'Active') {
    return (
      <CompletionShell>
        <p>Join this Quest before redeeming a completion code.</p>
      </CompletionShell>
    );
  }

  return (
    <CompletionShell>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="font-medium" htmlFor="completion-code-input">
            Completion code
          </label>
          <input
            aria-describedby={validationError ? 'completion-code-error' : undefined}
            aria-invalid={validationError !== null}
            autoCapitalize="characters"
            autoComplete="off"
            className="input input-bordered mt-1 w-full font-mono tracking-widest sm:max-w-xs"
            disabled={pending}
            id="completion-code-input"
            onChange={(event) => {
              setCodeInput(event.target.value);
              setValidationError(null);
            }}
            placeholder="XXXXX-XXXXX"
            spellCheck={false}
            type="text"
            value={codeInput}
          />
          {validationError && (
            <p className="mt-1 text-sm text-error" id="completion-code-error" role="alert">
              {validationError}
            </p>
          )}
        </div>
        <button
          aria-busy={pending}
          className="btn btn-success w-full sm:w-auto"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Redeeming…' : 'Redeem code'}
        </button>
      </form>
      {submitError && (
        <p className="mt-3 text-error" role="alert">
          {submitError}
        </p>
      )}
    </CompletionShell>
  );
}

function CompletionShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="completion-heading"
      className="mb-6 rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6"
    >
      <h2 className="mb-3 text-xl font-semibold" id="completion-heading">
        Quest completion
      </h2>
      {children}
    </section>
  );
}

function formatTimestamp(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function redeemErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400 && error.problem?.type === INVALID_COMPLETION_CODE_TYPE) {
      return 'That code is not valid. Check the code and try again.';
    }
    if (error.status === 400) {
      return 'Completion codes are not available for this Quest.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have access to complete this Quest.';
    }
    if (error.status === 404) {
      return 'This Quest is no longer available.';
    }
    if (error.status === 409) {
      return error.problem?.detail
        ?? 'Your completion could not be recorded. Please try again.';
    }
    if (error.status === 429) {
      if (error.retryAfterSeconds !== undefined) {
        const minutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
        return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
      }
      return 'Too many attempts. Please wait before trying again.';
    }
  }
  return 'The completion request failed. Please try again.';
}

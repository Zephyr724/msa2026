import {
  CheckCircle2,
  KeyRound,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../../hooks/useAuth.ts';
import {
  useMyQuestCompletionQuery,
  useRedeemCompletionCode,
} from '../../hooks/useCompletion.ts';
import { useMyQuestParticipationQuery } from '../../hooks/useParticipation.ts';
import { ApiError } from '../../lib/api/apiFetch.ts';
import { NORMALIZED_COMPLETION_CODE_PATTERN } from '../../types/completion.ts';
import type { QuestRegistrationMode } from '../../types/quest.ts';
import { useRewardFeedback } from '../reward/rewardFeedback.ts';

const INVALID_COMPLETION_CODE_TYPE =
  'https://kiwimpact.app/problems/invalid-completion-code';

interface QuestCompletionPanelProps {
  questId: string;
  questTitle?: string;
  registrationMode: QuestRegistrationMode | null;
}

/**
 * Completion codes remain short-lived component state. Success opens a reward
 * surface only after the server accepts redemption and the authoritative
 * queries have been resynchronized.
 */
export default function QuestCompletionPanel({
  questId,
  questTitle = 'this quest',
  registrationMode,
}: QuestCompletionPanelProps) {
  const auth = useAuthQuery();
  const participation = useMyQuestParticipationQuery(questId);
  const completion = useMyQuestCompletionQuery(questId);
  const redeem = useRedeemCompletionCode(questId);
  const { showReward } = useRewardFeedback();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (dialogOpen) inputRef.current?.focus();
  }, [dialogOpen]);

  function closeCompletionDialog() {
    if (pending) return;
    setDialogOpen(false);
    setCodeInput('');
    setValidationError(null);
    setSubmitError(null);
    // Restore focus after React removes the dialog from the tree.
    queueMicrotask(() => triggerRef.current?.focus());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    // Normalize the display-friendly form before applying the same alphabet
    // and length constraint enforced by the server.
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
      const result = await redeem(normalized);
      setCodeInput('');
      setDialogOpen(false);
      showReward({ ...result.reward, questTitle });
    } catch (error) {
      setSubmitError(redeemErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

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
        <p className="text-sm text-muted-content">Sign in to redeem a completion code.</p>
        <Link className="btn btn-primary btn-sm mt-4 w-full" to="/login">
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
  if (participation.isError || completion.isError
      || !participation.data || !completion.data) {
    if (loadError instanceof ApiError && loadError.status === 401) {
      return (
        <CompletionShell>
          <p role="alert">Your session has expired. Sign in again to continue.</p>
          <Link className="btn btn-primary btn-sm mt-4 w-full" to="/login">Sign in</Link>
        </CompletionShell>
      );
    }
    return (
      <CompletionShell>
        <p role="alert">We could not load your completion state.</p>
        <button
          className="btn btn-outline btn-sm mt-4 w-full"
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
        <p className="flex items-center gap-2 font-bold text-success" role="status">
          <CheckCircle2 aria-hidden="true" className="size-5" />
          Quest completed. Nice work!
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <Timestamp label="Completed" value={completion.data.completedAtUtc} />
          <Timestamp label="Verified" value={completion.data.verifiedAtUtc} />
        </dl>
      </CompletionShell>
    );
  }

  if (participation.data.ineligibilityReason === 'OwnQuest') {
    return (
      <CompletionShell>
        <p className="text-sm font-medium">
          You created this Quest, so you cannot complete it with a code.
        </p>
      </CompletionShell>
    );
  }

  if (participation.data.status !== 'Active') {
    return (
      <CompletionShell>
        <p className="text-sm text-muted-content">
          Join this Quest before redeeming a completion code.
        </p>
      </CompletionShell>
    );
  }

  return (
    <>
      <CompletionShell>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-bold">Ready to complete?</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-content">
              Enter the code shared by the organizer after taking part.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary mt-5 w-full"
          onClick={() => setDialogOpen(true)}
          ref={triggerRef}
          type="button"
        >
          Complete quest
        </button>
      </CompletionShell>

      <dialog
        aria-labelledby="completion-dialog-title"
        className="modal modal-bottom bg-black/55 p-0 backdrop-blur-sm sm:modal-middle"
        onCancel={(event) => {
          event.preventDefault();
          closeCompletionDialog();
        }}
        onClick={(event: MouseEvent<HTMLDialogElement>) => {
          if (event.target === event.currentTarget) closeCompletionDialog();
        }}
        open={dialogOpen}
      >
        <div className="modal-box rounded-t-[1.75rem] border border-base-300 bg-base-100 p-0 sm:rounded-[1.75rem]">
          <div className="flex items-start justify-between border-b border-base-300 p-5 sm:p-6">
            <div>
              <p className="kiwi-stat-label">Verified completion</p>
              <h2 className="mt-1 text-2xl" id="completion-dialog-title">
                Enter your completion code
              </h2>
            </div>
            <button
              aria-label="Close completion dialog"
              className="btn btn-ghost btn-sm btn-square"
              disabled={pending}
              onClick={closeCompletionDialog}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form className="p-5 sm:p-6" onSubmit={handleSubmit}>
            <p className="text-sm leading-relaxed text-muted-content">
              The organizer will share a 10-character code at the end of the quest.
              Codes are checked securely by Kiwimpact.
            </p>
            <label className="form-control mt-5" htmlFor="completion-code-input">
              <span className="mb-2 text-sm font-bold">Completion code</span>
              <input
                aria-describedby={validationError ? 'completion-code-error' : undefined}
                aria-invalid={validationError !== null}
                autoCapitalize="characters"
                autoComplete="off"
                className="input input-bordered h-14 w-full rounded-2xl text-center font-mono text-lg tracking-[0.25em]"
                disabled={pending}
                id="completion-code-input"
                maxLength={12}
                onChange={(event) => {
                  setCodeInput(event.target.value);
                  setValidationError(null);
                }}
                placeholder="XXXXX-XXXXX"
                ref={inputRef}
                spellCheck={false}
                type="text"
                value={codeInput}
              />
            </label>
            {validationError && (
              <p className="mt-2 text-sm text-error" id="completion-code-error" role="alert">
                {validationError}
              </p>
            )}
            {submitError && (
              <p className="mt-3 rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">
                {submitError}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="btn btn-ghost"
                disabled={pending}
                onClick={closeCompletionDialog}
                type="button"
              >
                Not yet
              </button>
              <button
                aria-busy={pending}
                className="btn btn-primary px-6"
                disabled={pending}
                type="submit"
              >
                {pending ? 'Redeeming…' : 'Verify completion'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

    </>
  );
}

function CompletionShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="completion-heading"
      className="kiwi-panel p-5"
    >
      <h2 className="mb-3 text-xl" id="completion-heading">Quest completion</h2>
      {children}
    </section>
  );
}

function Timestamp({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-base-300 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-content">{label}</dt>
      <dd className="text-right font-semibold">{formatTimestamp(value)}</dd>
    </div>
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

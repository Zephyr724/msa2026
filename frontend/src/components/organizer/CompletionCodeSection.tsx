import { useEffect, useRef, useState } from 'react';
import ConfirmActionDialog from './ConfirmActionDialog';
import {
  useCompletionCodeStatusQuery,
  useGenerateOrRotateCompletionCode,
} from '../../hooks/useCompletion';
import { ApiError } from '../../lib/api/apiFetch';
import type { QuestManagementDetailDto } from '../../types/questManagement';

interface CompletionCodeSectionProps {
  quest: QuestManagementDetailDto;
}

/**
 * Organizer Completion Code management (Slice 4B). The reveal-once plaintext
 * lives only in `revealedCode` component state: it is never written to
 * QueryCache, MutationCache, Zustand, storage, URLs, toasts, or logs, and it
 * is dropped on dismissal, unmount, reload, or rotation replacement.
 */
export default function CompletionCodeSection({ quest }: CompletionCodeSectionProps) {
  const status = useCompletionCodeStatusQuery(quest.id);
  const generateOrRotate = useGenerateOrRotateCompletionCode(quest.id);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealWasRotation, setRevealWasRotation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  const manageable = quest.status === 'Published'
    && quest.sourceType === 'OrganizerOwned'
    && quest.registrationMode === 'Native';

  useEffect(() => {
    if (revealedCode !== null) {
      setCopied(false);
      setCopyFailed(false);
      revealRef.current?.focus();
    }
  }, [revealedCode]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function runGenerateOrRotate(wasRotation: boolean) {
    if (pending) return;
    setPending(true);
    setActionError(null);
    try {
      const generated = await generateOrRotate();
      // Atomic replacement on success only: a failed rotation must never
      // destroy the only visible copy of the still-active code (review M2).
      setRevealedCode(generated.code);
      setRevealWasRotation(wasRotation);
      setConfirmingRotate(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setForbidden(true);
        setConfirmingRotate(false);
      } else {
        setActionError(managementErrorMessage(error));
      }
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    if (revealedCode === null) return;
    try {
      await navigator.clipboard.writeText(revealedCode);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  function dismissReveal() {
    setRevealedCode(null);
  }

  const statusForbidden = status.error instanceof ApiError && status.error.status === 403;
  const statusUnauthorized = status.error instanceof ApiError && status.error.status === 401;

  return (
    <section
      aria-labelledby="completion-code-heading"
      className="kiwi-panel mt-8 p-5 sm:p-6"
    >
      <h2 className="text-2xl" id="completion-code-heading">
        Completion code
      </h2>
      <p className="mt-1 text-sm text-muted-content">
        Participants enter this code to mark the Quest as completed.
      </p>

      {revealedCode !== null && (
        <div
          aria-labelledby="completion-code-reveal-heading"
          className="mt-4 rounded-lg border border-success/40 bg-success/10 p-4"
          ref={revealRef}
          role="group"
          tabIndex={-1}
        >
          <h3 className="font-semibold" id="completion-code-reveal-heading">
            Your new completion code
          </h3>
          <p className="mt-1 text-sm">
            This code is shown only once and cannot be viewed again. Copy it now
            and share it with participants when the Quest is done.
          </p>
          {revealWasRotation && (
            <p className="mt-1 text-sm font-medium">
              The previous code stopped working immediately.
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              aria-label="New completion code"
              className="input input-bordered w-full font-mono text-lg tracking-widest sm:w-auto"
              onFocus={(event) => event.target.select()}
              readOnly
              value={revealedCode}
            />
            <button
              className="btn btn-outline w-full sm:w-auto"
              onClick={handleCopy}
              type="button"
            >
              Copy code
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-success" role="status">
              Code copied to clipboard.
            </p>
          )}
          {copyFailed && (
            <p className="mt-2 text-sm text-error" role="alert">
              Copying failed. Select the code and copy it manually.
            </p>
          )}
          <button
            className="btn btn-primary mt-3 w-full sm:w-auto"
            onClick={dismissReveal}
            type="button"
          >
            Done — I have saved the code
          </button>
        </div>
      )}

      {forbidden || statusForbidden ? (
        <p className="mt-4" role="alert">
          You don&apos;t have access to manage completion codes for this quest.
        </p>
      ) : statusUnauthorized ? (
        <p className="mt-4" role="alert">
          Your session has expired. Sign in again to manage completion codes.
        </p>
      ) : status.isPending ? (
        <div aria-live="polite" className="mt-4 space-y-2">
          <p className="sr-only">Loading completion code status…</p>
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-10 w-full sm:w-64" />
        </div>
      ) : status.isError || !status.data ? (
        <div className="mt-4">
          <p role="alert">{statusLoadErrorMessage(status.error)}</p>
          <button
            className="btn btn-outline btn-sm mt-2"
            onClick={() => status.refetch()}
            type="button"
          >
            Retry status
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {status.data.isConfigured ? (
            <div>
              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-medium">Valid from</dt>
                  <dd>{formatTimestamp(status.data.validFromUtc)}</dd>
                </div>
                <div>
                  <dt className="font-medium">Valid until</dt>
                  <dd>{status.data.validToUtc ? formatTimestamp(status.data.validToUtc) : 'No expiry'}</dd>
                </div>
                <div>
                  <dt className="font-medium">Created</dt>
                  <dd>{formatTimestamp(status.data.createdAtUtc)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm text-muted-content">
                For security the code itself cannot be viewed again. Rotate it
                to replace a lost or shared code.
              </p>
              {manageable ? (
                <button
                  className="btn btn-outline mt-3 w-full sm:w-auto"
                  onClick={() => {
                    setActionError(null);
                    setConfirmingRotate(true);
                  }}
                  type="button"
                >
                  Rotate code
                </button>
              ) : (
                <p className="mt-2 text-sm text-muted-content">
                  {ineligibilityNote(quest)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p>No completion code is active for this quest.</p>
              {manageable ? (
                <button
                  aria-busy={pending && !confirmingRotate}
                  className="btn btn-primary mt-3 w-full sm:w-auto"
                  disabled={pending}
                  onClick={() => runGenerateOrRotate(false)}
                  type="button"
                >
                  {pending && !confirmingRotate ? 'Generating…' : 'Generate completion code'}
                </button>
              ) : (
                <p className="mt-2 text-sm text-muted-content">
                  {ineligibilityNote(quest)}
                </p>
              )}
            </div>
          )}
          {actionError !== null && !confirmingRotate && (
            <div className="alert alert-error mt-4" role="alert">
              <span>{actionError}</span>
            </div>
          )}
        </div>
      )}

      <ConfirmActionDialog
        cancelLabel="Keep current code"
        confirmLabel="Rotate code"
        description="The current code stops working as soon as the new one is created. Participants will need the new code to complete this Quest."
        error={actionError}
        onClose={() => {
          setConfirmingRotate(false);
          setActionError(null);
        }}
        onConfirm={() => runGenerateOrRotate(true)}
        open={confirmingRotate}
        pending={pending}
        pendingLabel="Rotating…"
        title="Rotate completion code?"
      />
    </section>
  );
}

function ineligibilityNote(quest: QuestManagementDetailDto): string {
  if (quest.status === 'Draft') {
    return 'Publish this Quest before generating a completion code.';
  }
  if (quest.status === 'Cancelled' || quest.status === 'Archived') {
    return 'Cancelled or archived quests cannot use completion codes.';
  }
  return 'This quest’s source or registration mode does not support completion codes.';
}

function formatTimestamp(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function statusLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'This quest is no longer available to manage.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait before trying again.';
    }
  }
  return 'We could not load the completion code status.';
}

function rateLimitMessage(retryAfterSeconds: number | undefined): string {
  if (retryAfterSeconds !== undefined) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  }
  return 'Too many attempts. Please wait before trying again.';
}

function managementErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 || error.status === 400) {
      return error.problem?.detail
        ?? 'The completion code could not be updated. Please try again.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Sign in again to manage completion codes.';
    }
    if (error.status === 404) {
      return 'This quest is no longer available to manage.';
    }
    if (error.status === 429) {
      return rateLimitMessage(error.retryAfterSeconds);
    }
  }
  return 'The completion code could not be updated. Please try again.';
}

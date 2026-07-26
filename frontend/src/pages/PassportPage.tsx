import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import {
  PASSPORT_HISTORY_PAGE_SIZE,
  usePassportCompletions,
} from '../hooks/usePassportCompletions.ts';
import { ApiError } from '../lib/api/apiFetch.ts';
import PassportSummaryCard from '../components/passport/PassportSummaryCard.tsx';
import CompletionHistoryList from '../components/passport/CompletionHistoryList.tsx';
import PassportPagination from '../components/passport/PassportPagination.tsx';

const PROGRESSION_NOT_READY_TYPE =
  'https://kiwimpact.app/problems/progression-not-ready';

function isNotReady(error: unknown): boolean {
  return error instanceof ApiError
    && error.status === 503
    && error.problem?.type === PROGRESSION_NOT_READY_TYPE;
}

function isMissingProfile(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function RegionSkeleton({ label }: { label: string }) {
  return (
    <div aria-live="polite" className="mt-4 space-y-3">
      <p className="sr-only">{label}</p>
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-24 w-full" />
    </div>
  );
}

function RegionError({
  error,
  notReadyMessage,
  onRetry,
}: {
  error: unknown;
  notReadyMessage: string;
  onRetry: () => void;
}) {
  if (isNotReady(error)) {
    return (
      <div className="alert alert-info mt-4" role="status">
        <span>{notReadyMessage}</span>
        <button className="btn btn-sm btn-ghost" onClick={onRetry} type="button">
          Retry
        </button>
      </div>
    );
  }
  if (isMissingProfile(error)) {
    return (
      <div className="alert alert-warning mt-4" role="alert">
        <span>Passport unavailable</span>
      </div>
    );
  }
  return (
    <div className="alert alert-error mt-4" role="alert">
      <span>We could not load this section.</span>
      <button className="btn btn-sm btn-ghost" onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}

export default function PassportPage() {
  const auth = useAuthQuery();
  const progression = useProgression();
  const [page, setPage] = useState(1);
  const history = usePassportCompletions(page, PASSPORT_HISTORY_PAGE_SIZE);
  const queryClient = useQueryClient();

  // Redemption resync invalidates ['passport']; the history view returns to
  // page 1 so a new Verified completion is visible (m3).
  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated'
        && event.action.type === 'invalidate'
        && event.query.queryKey[0] === 'passport'
      ) {
        setPage(1);
      }
    });
  }, [queryClient]);

  // Clamp to the last page when a refetch reports fewer pages (m3).
  const totalPages = history.data?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > Math.max(totalPages, 1)) {
      setPage(Math.max(totalPages, 1));
    }
  }, [totalPages, page]);

  // The RequireAuth guard guarantees a session here; the display name comes
  // from the existing session query only (no duplicated identity state).
  const displayName = auth.data?.displayName ?? '';

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">{displayName} — Passport</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <section
          aria-labelledby="passport-summary-heading"
          className="md:col-span-1"
        >
          <h2 className="text-xl font-semibold" id="passport-summary-heading">
            Progress
          </h2>
          <div className="mt-4">
            {progression.isPending && (
              <RegionSkeleton label="Loading your progress…" />
            )}
            {progression.isError && (
              <RegionError
                error={progression.error}
                notReadyMessage="Your progress is being prepared. Try again shortly."
                onRetry={() => void progression.refetch()}
              />
            )}
            {progression.isSuccess && (
              <PassportSummaryCard progression={progression.data} />
            )}
          </div>
        </section>
        <section
          aria-labelledby="passport-history-heading"
          className="md:col-span-2"
        >
          <h2 className="text-xl font-semibold" id="passport-history-heading">
            Completion history
          </h2>
          <div className="mt-4">
            {history.isPending && (
              <RegionSkeleton label="Loading your completion history…" />
            )}
            {history.isError && (
              <RegionError
                error={history.error}
                notReadyMessage="Your completion history is being prepared. Try again shortly."
                onRetry={() => void history.refetch()}
              />
            )}
            {history.isSuccess && history.data.items.length === 0 && (
              <div className="rounded-box border border-base-300 bg-base-100 p-6 text-center">
                <p className="text-base-content/70">No verified completions yet.</p>
                <Link className="btn btn-primary btn-sm mt-4" to="/quests">
                  Discover quests
                </Link>
              </div>
            )}
            {history.isSuccess && history.data.items.length > 0 && (
              <>
                <CompletionHistoryList items={history.data.items} />
                {history.data.totalPages > 1 && (
                  <PassportPagination
                    hasNextPage={history.data.hasNextPage}
                    hasPreviousPage={history.data.hasPreviousPage}
                    onPageChange={setPage}
                    page={history.data.page}
                    totalPages={history.data.totalPages}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

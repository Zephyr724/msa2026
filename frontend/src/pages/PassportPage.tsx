import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import {
  PASSPORT_HISTORY_PAGE_SIZE,
  usePassportCommunityParticipation,
  usePassportCompletions,
  usePassportSummary,
} from '../hooks/usePassportCompletions.ts';
import { ApiError } from '../lib/api/apiFetch.ts';
import PassportSummaryCard from '../components/passport/PassportSummaryCard.tsx';
import AchievementsSection from '../components/passport/AchievementsSection.tsx';
import CompletionHistoryList from '../components/passport/CompletionHistoryList.tsx';
import PassportPagination from '../components/passport/PassportPagination.tsx';
import { useMyClaims } from '../hooks/useCompletion.ts';
import CommunityProfileCard from '../components/community/CommunityProfileCard.tsx';
import ShareCard from '../components/passport/ShareCard.tsx';
import NextMilestoneCard from '../components/passport/NextMilestoneCard.tsx';
import CategoryImpactSection from '../components/passport/CategoryImpactSection.tsx';
import CommunityParticipationSection from '../components/passport/CommunityParticipationSection.tsx';
import { useWeeklyStreak } from '../hooks/useCommunity.ts';

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
  const summary = usePassportSummary();
  const communityParticipation = usePassportCommunityParticipation();
  const streak = useWeeklyStreak();
  const queryClient = useQueryClient();
  const claims = useMyClaims();

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
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page max-w-5xl">
        <header>
          <p className="kiwi-stat-label">Personal Impact Passport</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{displayName} — Passport</h1>
          <p className="mt-3 max-w-2xl text-lg text-base-content/62">
            Your verified, reviewed, and self-reported participation in one place.
          </p>
        </header>
        <div className="mt-8">
        <section aria-labelledby="passport-summary-heading">
          <h2 className="sr-only" id="passport-summary-heading">
            Progress
          </h2>
          <div>
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
              <PassportSummaryCard
                displayName={displayName}
                passport={summary.data}
                progression={progression.data}
                streakWeeks={streak.data?.currentWeeks}
              />
            )}
          </div>
        </section>
        {summary.isPending && <RegionSkeleton label="Loading Passport insights…" />}
        {summary.isError && (
          <RegionError
            error={summary.error}
            notReadyMessage="Your Passport insights are being prepared. Try again shortly."
            onRetry={() => void summary.refetch()}
          />
        )}
        {summary.data && (
          <>
            <NextMilestoneCard summary={summary.data} />
            <CategoryImpactSection summary={summary.data} />
          </>
        )}
        <AchievementsSection />
        {communityParticipation.isPending && (
          <RegionSkeleton label="Loading community participation…" />
        )}
        {communityParticipation.isError && (
          <RegionError
            error={communityParticipation.error}
            notReadyMessage="Your community participation is being prepared. Try again shortly."
            onRetry={() => void communityParticipation.refetch()}
          />
        )}
        {communityParticipation.data && (
          <CommunityParticipationSection items={communityParticipation.data} />
        )}
        <section className="mt-10" aria-labelledby="passport-preferences-heading">
          <p className="kiwi-stat-label">Privacy and sharing</p>
          <h2 className="mt-1 text-2xl" id="passport-preferences-heading">
            Passport settings
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <CommunityProfileCard />
            <div className="mt-6">
              <ShareCard
                completion={history.data?.items.find(
                  (item) => item.status === 'Verified',
                )}
              />
            </div>
          </div>
        </section>
        <section className="kiwi-panel mt-6 p-5" aria-labelledby="claim-history-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="kiwi-stat-label">Evidence-reviewed impact</p>
              <h3 className="mt-1 text-2xl" id="claim-history-heading">My claims</h3>
            </div>
            <Link className="btn btn-ghost btn-sm" to="/settings/password">Account safety</Link>
          </div>
          {claims.isPending && <p className="mt-4">Loading claims…</p>}
          {claims.data?.length === 0 && <p className="mt-4 text-sm text-base-content/60">No evidence claims yet.</p>}
          <ul className="mt-4 grid gap-3">
            {claims.data?.map((claim) => (
              <li className="flex items-center justify-between gap-4 rounded-2xl bg-base-200 p-4" key={claim.claimId}>
                <div><p className="font-bold">{claim.questTitle}</p>
                  <p className="text-xs text-base-content/55">{new Date(claim.createdAtUtc).toLocaleDateString()}</p></div>
                <span className={`badge ${claim.status === 'Verified' ? 'badge-success' : claim.status === 'Rejected' ? 'badge-error' : 'badge-warning'}`}>
                  {claim.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="passport-history-heading" className="mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kiwi-stat-label">Impact record</p>
              <h2 className="mt-1 text-2xl" id="passport-history-heading">
                Completion history
              </h2>
            </div>
            <Link className="btn btn-outline btn-sm rounded-full" to="/passport/share">
              Create Share Card
            </Link>
          </div>
          <div>
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
              <div className="kiwi-panel p-10 text-center">
                <p className="text-base-content/70">No verified completions yet.</p>
                <Link className="btn btn-primary btn-sm mt-4 rounded-full" to="/quests">
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
    </div>
  );
}

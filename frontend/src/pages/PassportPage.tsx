import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import {
  PASSPORT_HISTORY_PAGE_SIZE,
  useAllPassportCompletions,
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
import { CATEGORY_PRESENTATION } from '../lib/questPresentation.ts';
import { QUEST_CATEGORIES, type QuestCategory } from '../types/quest.ts';

const PROGRESSION_NOT_READY_TYPE =
  'https://kiwimpact.app/problems/progression-not-ready';
const PROFILE_NOT_FOUND_TYPE =
  'https://kiwimpact.app/problems/profile-not-found';

function isNotReady(error: unknown): boolean {
  return error instanceof ApiError
    && error.status === 503
    && error.problem?.type === PROGRESSION_NOT_READY_TYPE;
}

function isMissingProfile(error: unknown): boolean {
  return error instanceof ApiError
    && error.status === 404
    && error.problem?.type === PROFILE_NOT_FOUND_TYPE;
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
  const [historyFilter, setHistoryFilter] = useState<'all' | 'verified' | 'selfReported'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | QuestCategory>('all');
  const history = usePassportCompletions(page, PASSPORT_HISTORY_PAGE_SIZE);
  const completeHistory = useAllPassportCompletions(
    historyFilter !== 'all' || categoryFilter !== 'all',
  );
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
  const usesCompleteHistory = historyFilter !== 'all' || categoryFilter !== 'all';
  const historyItems = !usesCompleteHistory
    ? history.data?.items ?? []
    : completeHistory.data ?? [];
  const visibleHistoryItems = historyItems.filter((item) => {
    const statusMatches = historyFilter === 'all'
      || (historyFilter === 'verified' && item.status === 'Verified')
      || (historyFilter === 'selfReported' && item.status === 'SelfReported');
    const categoryMatches = categoryFilter === 'all'
      || item.questCategory === categoryFilter;
    return statusMatches && categoryMatches;
  });
  const historyPending = usesCompleteHistory ? completeHistory.isPending : history.isPending;
  const historyError = usesCompleteHistory ? completeHistory.isError : history.isError;
  const historyErrorValue = usesCompleteHistory ? completeHistory.error : history.error;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-base-200 py-8">
      <main className="kiwi-page-wide max-w-[1200px]">
        <h1 className="sr-only">{displayName} — Passport</h1>
        <div>
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
        <div id="passport-achievements">
          <AchievementsSection />
        </div>
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
            <div className="flex flex-wrap items-center gap-3">
              <div aria-label="Completion history filter" className="kiwi-segmented" role="group">
                {([
                  ['all', 'All'],
                  ['verified', 'Verified'],
                  ['selfReported', 'Self-reported'],
                ] as const).map(([value, label]) => (
                  <button
                    aria-pressed={historyFilter === value}
                    className={historyFilter === value ? 'active' : ''}
                    key={value}
                    onClick={() => setHistoryFilter(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                aria-label="Filter completion history by category"
                className="select select-bordered select-sm rounded-xl bg-base-100"
                onChange={(event) => setCategoryFilter(event.target.value as 'all' | QuestCategory)}
                value={categoryFilter}
              >
                <option value="all">All categories</option>
                {QUEST_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_PRESENTATION[category].label}
                  </option>
                ))}
              </select>
              <Link className="btn btn-outline btn-sm rounded-full" to="/passport/share">
                Create Share Card
              </Link>
            </div>
          </div>
          <div>
            {historyPending && (
              <RegionSkeleton label="Loading your completion history…" />
            )}
            {historyError && (
              <RegionError
                error={historyErrorValue}
                notReadyMessage="Your completion history is being prepared. Try again shortly."
                onRetry={() => {
                  if (!usesCompleteHistory) void history.refetch();
                  else void completeHistory.refetch();
                }}
              />
            )}
            {!historyPending && !historyError && historyItems.length === 0 && (
              <div className="kiwi-panel p-10 text-center">
                <p className="text-base-content/70">No verified completions yet.</p>
                <Link className="btn btn-primary btn-sm mt-4 rounded-full" to="/quests">
                  Discover quests
                </Link>
              </div>
            )}
            {!historyPending && !historyError && historyItems.length > 0 && visibleHistoryItems.length === 0 && (
              <div className="kiwi-panel p-8 text-center">
                <p className="font-bold">No matching records.</p>
                <p className="mt-1 text-sm text-base-content/60">
                  Change the history filter to see other completion types.
                </p>
              </div>
            )}
            {!historyPending && !historyError && visibleHistoryItems.length > 0 && (
              <>
                <CompletionHistoryList items={visibleHistoryItems} />
                {!usesCompleteHistory && history.data && history.data.totalPages > 1 && (
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

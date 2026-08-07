import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Share2 } from 'lucide-react';
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
import ShareCard from '../components/passport/ShareCard.tsx';
import TrophyProgressCard from '../components/passport/TrophyProgressCard.tsx';
import CategoryImpactSection from '../components/passport/CategoryImpactSection.tsx';
import CommunityParticipationSection from '../components/passport/CommunityParticipationSection.tsx';
import { useWeeklyStreak } from '../hooks/useCommunity.ts';
import { CATEGORY_PRESENTATION } from '../lib/questPresentation.ts';
import { QUEST_CATEGORIES, type QuestCategory } from '../types/quest.ts';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import { useMyAchievementProfile } from '../hooks/useAchievements.ts';
import PublicPassportSettingsCard from '../components/passport/PublicPassportSettingsCard.tsx';

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
  const achievementProfile = useMyAchievementProfile();

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
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kiwi-stat-label">Personal Impact Passport</p>
            <h1 className="mt-1 kiwi-page-heading">{displayName} — Passport</h1>
          </div>
          <Link className="btn btn-primary rounded-full" to="/passport/share">
            <Share2 aria-hidden="true" className="size-4" />
            Share Passport
          </Link>
        </div>
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
                cosmetics={achievementProfile.data?.cosmetics}
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
        {achievementProfile.isPending && (
          <RegionSkeleton label="Loading achievement trophy…" />
        )}
        {achievementProfile.isError && (
          <RegionError
            error={achievementProfile.error}
            notReadyMessage="Your achievement trophy is being prepared. Try again shortly."
            onRetry={() => void achievementProfile.refetch()}
          />
        )}
        {achievementProfile.data && (
          <TrophyProgressCard profile={achievementProfile.data} />
        )}
        {summary.data && (
          <CategoryImpactSection summary={summary.data} />
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
          <PublicPassportSettingsCard />
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              className="kiwi-panel mt-6 flex items-start gap-4 p-5 transition-colors hover:border-primary/35"
              to="/settings/profile#community"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <span aria-hidden="true" className="text-lg">⌂</span>
              </span>
              <span>
                <span className="kiwi-stat-label">Profile Settings</span>
                <strong className="mt-1 block text-xl">Home Community</strong>
                <span className="mt-1 block text-sm text-muted-content">
                  Choose or change your community and Passport visibility.
                </span>
                <span className="mt-3 block text-sm font-bold text-primary">
                  Open Community settings →
                </span>
              </span>
            </Link>
            <div className="mt-6">
              <ShareCard />
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
          {claims.data?.length === 0 && <p className="mt-4 text-sm text-muted-content">No evidence claims yet.</p>}
          <ul className="mt-4 grid gap-3">
            {claims.data?.map((claim) => (
              <li className="flex items-center justify-between gap-4 rounded-2xl bg-base-200 p-4" key={claim.claimId}>
                <div><p className="font-bold">{claim.questTitle}</p>
                  <p className="text-xs text-muted-content">{new Date(claim.createdAtUtc).toLocaleDateString()}</p></div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                  claim.status === 'Verified'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : claim.status === 'Rejected'
                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                }`}>
                  {claim.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="passport-history-heading" className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl" id="passport-history-heading">
                Completion history
              </h2>
            </div>
            <Link className="btn kiwi-share-action btn-sm rounded-full" to="/passport/share/completion">
              <Share2 aria-hidden="true" className="size-3.5" />
              Create Quest card
            </Link>
          </div>
          <p className="mb-4 text-xs text-muted-content">
            Your personal verified and self-reported quest completions.
          </p>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div aria-label="Completion history filter" className="flex flex-wrap gap-2" role="group">
              {([
                ['all', 'All'],
                ['verified', 'Verified'],
                ['selfReported', 'Self reported'],
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={historyFilter === value}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    historyFilter === value
                      ? 'border-primary bg-primary text-primary-content'
                      : 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'
                  }`}
                  key={value}
                  onClick={() => setHistoryFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              aria-label="Completion history category filter"
              className="flex flex-wrap gap-1"
              role="group"
            >
              {QUEST_CATEGORIES.map((category) => {
                const presentation = CATEGORY_PRESENTATION[category];
                const selected = categoryFilter === category;
                return (
                  <button
                    aria-label={`Filter completion history by ${presentation.label}`}
                    aria-pressed={selected}
                    className={`grid size-8 place-items-center overflow-hidden rounded-full border transition-colors ${
                      selected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-base-300 hover:bg-base-200'
                    }`}
                    key={category}
                    onClick={() => setCategoryFilter(selected ? 'all' : category)}
                    title={presentation.label}
                    type="button"
                  >
                    <CategoryEmblem category={category} size="xs" />
                  </button>
                );
              })}
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
                <p className="text-muted-content">No verified completions yet.</p>
                <Link className="btn btn-primary btn-sm mt-4 rounded-full" to="/quests">
                  Discover quests
                </Link>
              </div>
            )}
            {!historyPending && !historyError && historyItems.length > 0 && visibleHistoryItems.length === 0 && (
              <div className="kiwi-panel p-8 text-center">
                <p className="font-bold">No matching completions</p>
                <p className="mt-1 text-sm text-muted-content">
                  Try a different filter.
                </p>
                <button
                  className="btn btn-outline btn-sm mt-4 rounded-full"
                  onClick={() => {
                    setHistoryFilter('all');
                    setCategoryFilter('all');
                  }}
                  type="button"
                >
                  Show all
                </button>
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

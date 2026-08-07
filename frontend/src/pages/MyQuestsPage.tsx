import {
  ArrowRight,
  Award,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  FileCheck2,
  Flag,
  History,
  IdCard,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PlayerStatusSummary from '../components/PlayerStatusSummary.tsx';
import { AchievementBadgeArt } from '../components/game/GameArtwork.tsx';
import CategoryEmblem from '../components/quest/CategoryEmblem.tsx';
import QuestImage from '../components/quest/QuestImage.tsx';
import { useMyAchievements } from '../hooks/useAchievements.ts';
import { useMyClaims } from '../hooks/useCompletion.ts';
import {
  useCommunityChallenges,
  useMyProfile,
  useWeeklyStreak,
} from '../hooks/useCommunity.ts';
import {
  useAllPassportCompletions,
} from '../hooks/usePassportCompletions.ts';
import { useMyQuestParticipationsQuery } from '../hooks/useParticipation.ts';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_LABELS,
  DIFFICULTY_TONES,
  formatQuestDate,
  questHighlightTone,
} from '../lib/questPresentation.ts';
import type { EvidenceClaimSummary } from '../types/completion.ts';
import type {
  PassportCompletionItem,
} from '../types/passport.ts';
import type {
  MyQuestParticipationListItemDto,
} from '../types/participation.ts';

type MissionView = 'active' | 'ready' | 'review' | 'completed' | 'cancelled';

const primaryTabs: Array<{
  value: Exclude<MissionView, 'cancelled'>;
  label: string;
}> = [
  { value: 'active', label: 'Active' },
  { value: 'ready', label: 'Ready to Complete' },
  { value: 'review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
];

function readView(value: string | null, legacy: string | null): MissionView {
  if (
    value === 'active'
    || value === 'ready'
    || value === 'review'
    || value === 'completed'
    || value === 'cancelled'
  ) return value;
  // Preserve links created before the Mission Board adopted the `view` key.
  if (legacy === 'cancelled') return 'cancelled';
  return 'active';
}

export default function MyQuestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = readView(searchParams.get('view'), searchParams.get('status'));
  const participations = useMyQuestParticipationsQuery('all');
  const claims = useMyClaims();
  const passport = useAllPassportCompletions();
  const streak = useWeeklyStreak();
  const challenges = useCommunityChallenges();
  const profile = useMyProfile();
  const achievements = useMyAchievements();

  function setView(next: MissionView) {
    setSearchParams(next === 'active' ? {} : { view: next });
  }

  const completionByQuest = new Map(
    passport.data?.map((item) => [item.questId, item]) ?? [],
  );
  const claimByQuest = new Map<string, EvidenceClaimSummary>();
  for (const claim of claims.data ?? []) {
    // The API returns newest first. First write wins so an older rejected
    // attempt can never overwrite a newer resubmitted Pending claim.
    if (!claimByQuest.has(claim.questId)) claimByQuest.set(claim.questId, claim);
  }
  const activeParticipations = participations.data?.filter(
    (item) => item.status === 'Active',
  ) ?? [];
  const cancelledParticipations = participations.data?.filter(
    (item) => item.status === 'Cancelled',
  ) ?? [];
  // A participation is classified from authoritative completion and claim
  // state first, then split by whether its scheduled start has arrived.
  const active = activeParticipations.filter((item) => {
    const completion = completionByQuest.get(item.quest.id);
    const claim = claimByQuest.get(item.quest.id);
    if (completion?.status === 'Verified' || completion?.status === 'SelfReported') {
      return false;
    }
    if (claim?.status === 'Pending' || completion?.status === 'Pending') {
      return false;
    }
    return item.quest.startAtUtc === null
      || new Date(item.quest.startAtUtc).getTime() > Date.now();
  });
  const ready = activeParticipations.filter((item) => {
    const completion = completionByQuest.get(item.quest.id);
    const claim = claimByQuest.get(item.quest.id);
    if (completion?.status === 'Verified' || completion?.status === 'SelfReported') {
      return false;
    }
    if (claim?.status === 'Pending' || completion?.status === 'Pending') {
      return false;
    }
    return item.quest.startAtUtc !== null
      && new Date(item.quest.startAtUtc).getTime() <= Date.now();
  });
  const underReview = claims.data?.filter((claim) => claim.status === 'Pending') ?? [];
  const completed = passport.data?.filter(
    (item) => item.status === 'Verified' || item.status === 'SelfReported',
  ) ?? [];
  const recentAchievements = [...(achievements.data ?? [])]
    .sort((left, right) => (
      new Date(right.awardedAt).getTime() - new Date(left.awardedAt).getTime()
    ))
    .slice(0, 3);
  const primaryChallenge = challenges.data?.find(
    (challenge) => challenge.localArea.id === profile.data?.homeCommunity?.id,
  ) ?? challenges.data?.[0];
  const priorityAction = ready[0]
    // Prefer the action closest to verified impact, followed by work already
    // in progress, before suggesting a new Quest.
    ? {
        eyebrow: 'Ready to complete',
        title: ready[0].quest.title,
        description: `Choose an available completion method to finish this Quest.`,
        href: `/quests/${ready[0].quest.id}`,
        label: 'Complete quest',
      }
    : underReview[0]
      ? {
          eyebrow: 'Evidence under review',
          title: underReview[0].questTitle,
          description: 'Your private evidence is awaiting an Admin decision.',
          href: `/quests/${underReview[0].questId}`,
          label: 'View status',
        }
      : active[0]
        ? {
            eyebrow: 'Next active mission',
            title: active[0].quest.title,
            description: 'Review the Quest details and prepare for the activity.',
            href: `/quests/${active[0].quest.id}`,
            label: 'View details',
          }
        : {
            eyebrow: 'Choose your next action',
            title: 'Find a local Quest',
            description: 'Your Mission Board is ready for a new community action.',
            href: '/quests',
            label: 'Open Discover',
          };

  const currentCount = {
    active: active.length,
    ready: ready.length,
    review: underReview.length,
    completed: completed.length,
    cancelled: cancelledParticipations.length,
  }[view];

  const dataPending = participations.isPending || claims.isPending || passport.isPending;
  const dataError = participations.isError || claims.isError || passport.isError;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-8">
      <main className="kiwi-page">
        <header>
          <p className="kiwi-stat-label">Your next steps</p>
          <h1 className="mt-1 kiwi-page-heading">Mission Board</h1>
          <p className="kiwi-page-intro mt-1 max-w-2xl">
            Move from joining to completing, review, and a lasting Passport record.
          </p>
        </header>

        <div className="mt-5">
          <PlayerStatusSummary />
        </div>
        <section className="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Mission momentum">
          <article className="kiwi-panel p-4">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-warning">
                <Award aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="kiwi-stat-label">Next milestone</p>
                <h2 className="mt-1 text-lg">Keep building verified progress</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-content">
                  Your next verified action advances your Passport. Your
                  current weekly streak is{' '}
                  <strong>{streak.isPending ? 'loading' : streak.isError
                    ? 'unavailable'
                    : `${streak.data?.currentWeeks ?? 0} weeks`}</strong>.
                </p>
                <Link className="btn btn-ghost btn-sm -ml-3 mt-3" to="/passport">
                  View milestones <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </article>

          <article
            className="rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4"
            id="community-challenge"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-content">
                <Flag aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="kiwi-stat-label">Community challenge</p>
                <h2 className="mt-1 truncate text-lg">
                  {primaryChallenge
                    ? `${primaryChallenge.localArea.name} Challenge`
                    : 'Your local community goal'}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-content">
                  {challenges.isPending
                    ? 'Loading verified community progress…'
                    : primaryChallenge
                      ? `${primaryChallenge.currentProgress} of ${primaryChallenge.targetValue} verified actions · ${Math.round(primaryChallenge.progressPercentage)}%`
                      : challenges.isError ? 'Community progress unavailable.' : 'No active challenge.'}
                </p>
                {primaryChallenge && (
                  <>
                    <progress
                      aria-label={`${primaryChallenge.localArea.name} challenge progress`}
                      className="progress progress-primary mt-3 h-2.5 w-full"
                      max="100"
                      value={primaryChallenge.progressPercentage}
                    />
                    <p className="mt-2 text-xs leading-relaxed text-muted-content">
                      Any verified Quest attributed to this community during
                      the challenge counts automatically. Self-reports do not.
                    </p>
                    <p className="mt-2 text-xs font-bold text-primary">
                      Reward: community milestone badge for contributors
                    </p>
                  </>
                )}
                <p className="mt-2 text-xs font-semibold text-muted-content">
                  Home community: {profile.isPending
                    ? 'Loading…'
                    : profile.data?.homeCommunity?.name ?? 'Not set'}
                </p>
                <Link
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  to="/settings/profile"
                >
                  Change in Profile Settings <ChevronRight aria-hidden="true" className="size-3" />
                </Link>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/8 p-4" aria-label="Next action">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-warning">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="kiwi-stat-label">{priorityAction.eyebrow}</p>
              <h2 className="mt-1 truncate text-lg">{priorityAction.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-content">
                {priorityAction.description}
              </p>
            </div>
            <Link className="btn btn-primary btn-sm shrink-0 rounded-full" to={priorityAction.href}>
              {priorityAction.label} <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="mission-list-title">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kiwi-stat-label">Quest path</p>
                <h2 className="mt-1 text-2xl" id="mission-list-title">Your quests</h2>
              </div>
              <button
                aria-pressed={view === 'cancelled'}
                className={`btn btn-sm ${view === 'cancelled' ? 'btn-active' : 'btn-ghost'}`}
                onClick={() => setView('cancelled')}
                type="button"
              >
                <History aria-hidden="true" className="size-4" />
                Cancelled ({cancelledParticipations.length})
              </button>
            </div>
            <div
              aria-label="Mission Board view"
              className="grid grid-cols-2 border-b border-base-300 md:grid-cols-4"
              role="group"
            >
              {primaryTabs.map((tab) => (
                <button
                  aria-pressed={view === tab.value}
                  className={`min-h-14 border-b-[3px] px-3 py-3 text-base font-extrabold leading-tight transition-colors sm:text-lg ${
                    view === tab.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-content hover:border-primary/30 hover:text-primary'
                  }`}
                  key={tab.value}
                  onClick={() => setView(tab.value)}
                  type="button"
                >
                  {tab.label}
                  <span className="ml-1 opacity-70">
                    ({{
                      active: active.length,
                      ready: ready.length,
                      review: underReview.length,
                      completed: completed.length,
                    }[tab.value]})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {dataPending && (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="skeleton h-[28rem] rounded-[1.35rem]" key={index} />
              ))}
            </div>
          )}

          {dataError && (
            <div className="kiwi-panel mt-5 p-6" role="alert">
              <h3 className="text-xl">We could not classify your Mission Board</h3>
              <p className="mt-2 text-sm text-muted-content">
                No state is guessed when a participation, claim, or Passport read fails.
              </p>
              <button
                className="btn btn-primary btn-sm mt-4"
                onClick={() => void Promise.all([
                  participations.refetch(),
                  claims.refetch(),
                  passport.refetch(),
                ])}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {!dataPending && !dataError && currentCount === 0 && (
            <MissionEmptyState view={view} />
          )}

          {!dataPending && !dataError && view === 'active' && active.length > 0 && (
            <QuestGrid
              items={active}
              status={(item) => item.quest.startAtUtc === null
                ? 'Active · schedule to be confirmed'
                : `Active · starts ${
                  new Date(item.quest.startAtUtc).toLocaleDateString()
                }`}
            />
          )}

          {!dataPending && !dataError && view === 'ready' && ready.length > 0 && (
            <>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm">
                <FileCheck2 aria-hidden="true" className="size-5 shrink-0 text-warning" />
                <p>
                  Open a Quest to enter a completion code, submit evidence, or
                  add a clearly labelled self-reported record.
                </p>
              </div>
              <QuestGrid
                items={ready}
                status={(item) => {
                  const rejected = claimByQuest.get(item.quest.id)?.status === 'Rejected'
                    || completionByQuest.get(item.quest.id)?.status === 'Rejected';
                  return rejected ? 'Claim not verified · try again' : 'Ready to complete';
                }}
              />
            </>
          )}

          {!dataPending && !dataError && view === 'review' && underReview.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {underReview.map((claim) => <ReviewCard claim={claim} key={claim.claimId} />)}
            </div>
          )}

          {!dataPending && !dataError && view === 'completed' && completed.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {completed.map((item) => <CompletedCard item={item} key={item.completionId} />)}
            </div>
          )}

          {!dataPending && !dataError && view === 'cancelled'
            && cancelledParticipations.length > 0 && (
            <QuestGrid
              items={cancelledParticipations}
              status={() => 'Participation cancelled'}
            />
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2" aria-label="Recent progress">
          <div>
            <div className="mb-4">
              <p className="kiwi-stat-label">Milestones</p>
              <h2 className="mt-1 text-2xl">Recent achievements</h2>
            </div>
            {achievements.isPending ? (
              <div className="skeleton h-36 rounded-[1.35rem]" aria-label="Loading recent achievements" />
            ) : achievements.isError ? (
              <div className="kiwi-panel p-5 text-sm text-muted-content">
                Recent achievements are unavailable. Your verified mission
                state has not been guessed.
              </div>
            ) : recentAchievements.length > 0 ? (
              <div className="grid gap-3">
                {recentAchievements.map((achievement) => (
                  <article className="kiwi-panel flex items-center gap-4 p-4" key={achievement.achievementId}>
                    <AchievementBadgeArt
                      code={achievement.code}
                      label={achievement.name}
                      size={44}
                      unlocked
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold">{achievement.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-content">
                        {achievement.description}
                      </p>
                    </div>
                    <time className="text-xs text-muted-content" dateTime={achievement.awardedAt}>
                      {new Date(achievement.awardedAt).toLocaleDateString()}
                    </time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="kiwi-panel p-5 text-sm text-muted-content">
                Your first earned achievement will appear here after the
                server confirms its criteria.
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="kiwi-stat-label">Impact record</p>
                <h2 className="mt-1 text-2xl">Passport preview</h2>
              </div>
              <Link className="btn btn-ghost btn-sm" to="/passport">
                View full <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            {passport.isPending ? (
              <div className="skeleton h-36 rounded-[1.35rem]" aria-label="Loading Passport preview" />
            ) : completed.length > 0 ? (
              <div className="grid gap-3">
                {completed.slice(0, 4).map((item) => (
                  <Link
                    className="kiwi-panel flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5"
                    key={item.completionId}
                    to={`/quests/${item.questId}`}
                  >
                    <CategoryEmblem category={item.questCategory} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{item.questTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-content">
                        {new Date(item.completedAtUtc).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-content">
                      {item.status === 'Verified'
                        ? item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`
                        : 'Passport only'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="kiwi-panel flex items-start gap-3 p-5 text-sm text-muted-content">
                <IdCard aria-hidden="true" className="size-5 shrink-0 text-primary" />
                Completed Quest records will appear here without changing
                their verified or self-reported status.
              </div>
            )}
          </div>
        </section>

        <section className="kiwi-panel mt-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-warning">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-xl">Ready for another local action?</h2>
              <p className="mt-1 text-sm text-muted-content">
                Browse the full Quest catalogue and find your next mission.
              </p>
            </div>
          </div>
          <Link className="btn btn-outline rounded-full" to="/quests">
            <Compass aria-hidden="true" className="size-4" />
            Open Discover
          </Link>
        </section>
      </main>
    </div>
  );
}

function QuestGrid({
  items,
  status,
}: {
  items: MyQuestParticipationListItemDto[];
  status: (item: MyQuestParticipationListItemDto) => string;
}) {
  return (
    <div className="mt-5 grid gap-3">
      {items.map((item) => {
        const quest = item.quest;
        const statusText = status(item);
        const category = CATEGORY_PRESENTATION[quest.category];
        const nextStep = statusText.startsWith('Ready')
          ? 'Next step: choose a completion method to finish this Quest'
          : statusText.startsWith('Active')
            ? 'Next step: attend the activity, then complete the Quest'
            : statusText;
        return (
          <Link
            aria-label={`View ${quest.title}`}
            className="group overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
            key={item.participationId}
            to={`/quests/${quest.id}`}
          >
            <div className="flex flex-col sm:flex-row">
              <figure className="relative h-36 shrink-0 overflow-hidden bg-base-200 sm:h-auto sm:min-h-44 sm:w-40">
                <QuestImage
                  alt={quest.coverImage?.altText}
                  category={quest.category}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  height={440}
                  loading="lazy"
                  source={quest.coverImage?.imageUrl}
                  title={quest.title}
                  width={400}
                />
                <span className="absolute left-2 top-2 rounded-xl border-2 border-base-100 bg-base-100 shadow-md">
                  <CategoryEmblem category={quest.category} size="sm" />
                </span>
              </figure>
              <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${category.softTone}`}>
                      {category.label}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${questHighlightTone(statusText)}`}>
                      {statusText}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg transition-colors group-hover:text-primary">
                    {quest.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-content">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                      {formatQuestDate(quest.startAtUtc)}
                    </span>
                    <span className="flex min-w-0 items-start gap-1.5">
                      <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                      <span className="line-clamp-2">
                        {quest.locationDescription ?? quest.locationRegion?.name ?? 'Location to be confirmed'}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Sparkles aria-hidden="true" className="size-3" />
                      {quest.xpAward} XP
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${DIFFICULTY_TONES[quest.difficulty]}`}>
                      {DIFFICULTY_LABELS[quest.difficulty]}
                    </span>
                  </div>
                  <p className={`mt-3 text-xs font-bold ${
                    statusText.startsWith('Ready') ? 'text-amber-700' : 'text-primary'
                  }`}>
                    {nextStep}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
                  <span className="btn btn-primary btn-sm pointer-events-none">
                    {statusText.startsWith('Ready') ? 'Complete Quest' : 'View details'}
                  </span>
                  <span className="btn btn-outline btn-sm pointer-events-none">
                    Details
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ReviewCard({ claim }: { claim: EvidenceClaimSummary }) {
  return (
    <article className="kiwi-panel p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
          <Clock3 aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            Under review
          </span>
          <h3 className="mt-3 text-xl">{claim.questTitle}</h3>
          <p className="mt-2 text-sm text-muted-content">
            Submitted <time dateTime={claim.createdAtUtc}>
              {new Date(claim.createdAtUtc).toLocaleDateString()}
            </time>
          </p>
          <p className="mt-3 text-sm text-muted-content">
            XP is awarded only if an Admin approves this evidence claim.
          </p>
          <Link className="btn btn-outline btn-sm mt-4" to={`/quests/${claim.questId}`}>
            View Quest <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CompletedCard({ item }: { item: PassportCompletionItem }) {
  const verified = item.status === 'Verified';
  return (
    <article className="kiwi-panel p-5">
      <div className="flex items-start gap-3">
        <CategoryEmblem category={item.questCategory} size="md" />
        <div className="min-w-0 flex-1">
          <p className="kiwi-stat-label">
            {CATEGORY_PRESENTATION[item.questCategory].label}
          </p>
          <h3 className="mt-1 text-xl">{item.questTitle}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
              verified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {verified ? (
                <><ShieldCheck aria-hidden="true" className="size-3" /> Verified</>
              ) : 'Self-reported'}
            </span>
            <span className="text-xs text-muted-content">
              {new Date(item.completedAtUtc).toLocaleDateString()}
            </span>
            <span className="text-xs font-bold">
              {verified
                ? item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`
                : 'Passport only · no XP'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn btn-outline btn-sm" to={`/quests/${item.questId}`}>
              View Quest
            </Link>
            {verified && (
              <Link className="btn kiwi-share-action btn-sm" to="/passport/share">
                Create Share Card
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function MissionEmptyState({ view }: { view: MissionView }) {
  const state = {
    active: {
      Icon: Compass,
      title: 'No upcoming active missions',
      description: 'Join a future Quest and it will appear here.',
    },
    ready: {
      Icon: Target,
      title: 'Nothing ready to complete',
      description: 'Joined Quests move here when their start time arrives.',
    },
    review: {
      Icon: Clock3,
      title: 'No claims under review',
      description: 'Pending evidence claims appear here without guessed outcomes.',
    },
    completed: {
      Icon: Award,
      title: 'No completed Quests yet',
      description: 'Verified and self-reported Passport records appear here.',
    },
    cancelled: {
      Icon: RotateCcw,
      title: 'No cancelled Quests',
      description: 'Cancelled participation history remains available here.',
    },
  }[view];
  const Icon = state.Icon;

  return (
    <div className="kiwi-panel mt-5 px-6 py-14 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-5 text-2xl">{state.title}</h3>
      <p className="mx-auto mt-2 max-w-md text-muted-content">{state.description}</p>
      <Link className="btn btn-primary mt-5 rounded-full" to="/quests">
        Discover Quests <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

import { ApiError } from '../../lib/api/apiFetch.ts';
import {
  useAchievementCatalog,
  useAchievementNationwideStats,
  useMyAchievements,
} from '../../hooks/useAchievements.ts';
import AchievementCard from './AchievementCard.tsx';

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

function AchievementsSkeleton() {
  return (
    <div aria-live="polite" className="mt-4 space-y-3">
      <p className="sr-only">Loading your achievements…</p>
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-32 w-full" />
    </div>
  );
}

function AchievementsError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  if (isNotReady(error)) {
    return (
      <div className="alert alert-info mt-4" role="status">
        <span>Your achievements are being prepared. Try again shortly.</span>
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

export default function AchievementsSection() {
  const catalog = useAchievementCatalog();
  const earned = useMyAchievements();
  const stats = useAchievementNationwideStats();

  const retryBoth = () => {
    void Promise.all([catalog.refetch(), earned.refetch(), stats.refetch()]);
  };

  let content;
  if (catalog.isPending || earned.isPending) {
    content = <AchievementsSkeleton />;
  } else if (catalog.isError && earned.isError) {
    content = <AchievementsError error={catalog.error} onRetry={retryBoth} />;
  } else if (catalog.isError) {
    content = (
      <AchievementsError
        error={catalog.error}
        onRetry={() => void catalog.refetch()}
      />
    );
  } else if (earned.isError) {
    content = (
      <AchievementsError
        error={earned.error}
        onRetry={() => void earned.refetch()}
      />
    );
  } else if (catalog.data.length === 0) {
    content = (
      <div className="kiwi-panel p-8 text-center">
        <p className="text-muted-content">No achievements available yet.</p>
      </div>
    );
  } else {
    const earnedById = new Map<string, (typeof earned.data)[number]>();
    for (const item of earned.data) {
      // The API is chronological. Repeated Community Challenge awards retain
      // the first true unlock date on the single catalog card.
      if (!earnedById.has(item.achievementId))
        earnedById.set(item.achievementId, item);
    }
    const statsById = new Map(
      (stats.data ?? []).map((item) => [item.achievementId, item]),
    );
    const hasMissingStats = stats.isSuccess
      && catalog.data.some((item) => !statsById.has(item.id));
    const rarityUnavailable = (
      stats.isError && !isNotReady(stats.error)
    ) || hasMissingStats;
    const groups = groupAchievements(catalog.data);
    content = (
      <div className="space-y-8">
        {stats.isError && (
          <div className="alert alert-info py-3 text-sm" role="status">
            <span>
              {isNotReady(stats.error)
                ? 'Nationwide rarity is still being calculated.'
                : 'Nationwide rarity is unavailable.'}
            </span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => void stats.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {hasMissingStats && (
          <div className="alert alert-warning py-3 text-sm" role="status">
            <span>Some nationwide rarity results are unavailable.</span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => void stats.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {groups.map(([category, items], groupIndex) => {
          const headingId = `achievement-group-${groupIndex}`;
          return (
            <section aria-labelledby={headingId} key={category}>
              <h3 className="text-lg" id={headingId}>
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <p className="mt-1 text-xs text-muted-content">
                {CATEGORY_DESCRIPTIONS[category]
                  ?? 'Complete verified impact to unlock this achievement family.'}
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((catalogItem) => {
                  const earnedItem = earnedById.get(catalogItem.id);
                  const stat = statsById.get(catalogItem.id);
                  return earnedItem === undefined ? (
                    <AchievementCard
                      achievement={catalogItem}
                      key={catalogItem.id}
                      rarityUnavailable={rarityUnavailable}
                      stat={stat}
                      unlocked={false}
                    />
                  ) : (
                    <AchievementCard
                      achievement={earnedItem}
                      key={catalogItem.id}
                      rarityUnavailable={rarityUnavailable}
                      stat={stat}
                      unlocked
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <section aria-labelledby="passport-achievements-heading" className="mt-10">
      <p className="kiwi-stat-label">Achievement families</p>
      <h2 className="mt-1 text-2xl" id="passport-achievements-heading">Achievements</h2>
      <p className="mt-1 text-sm text-muted-content">
        Completion, category, streak, level, and community achievements — with
        nationwide rarity updated from distinct members.
      </p>
      <div className="mt-4">{content}</div>
    </section>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  Milestone: 'Verified impact milestones',
  Specialist: 'Category specialists',
  Explorer: 'Whole-system explorers',
  Streak: 'Consistency streaks',
  Progression: 'Level progression',
  Community: 'Community challenges',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Milestone: 'Build a lifetime record of verified Quest completions.',
  Specialist: 'Develop deep impact in each environmental action category.',
  Explorer: 'Make verified contributions across all six categories.',
  Streak: 'Return in consecutive Auckland calendar weeks.',
  Progression: 'Reach new levels through authoritative XP.',
  Community: 'Earn recognition from completed local community challenges.',
};

function groupAchievements<T extends { category: string }>(
  items: readonly T[],
): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  const ordered = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category): [string, T[]] => [
      category,
      groups.get(category) ?? [],
    ]);
  const known = new Set<string>(CATEGORY_ORDER);
  return [
    ...ordered,
    ...[...groups.entries()].filter(([category]) => !known.has(category)),
  ];
}

const CATEGORY_ORDER = [
  'Milestone',
  'Specialist',
  'Explorer',
  'Streak',
  'Progression',
  'Community',
] as const;

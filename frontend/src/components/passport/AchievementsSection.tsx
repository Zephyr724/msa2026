import { ApiError } from '../../lib/api/apiFetch.ts';
import {
  useAchievementCatalog,
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

  const retryBoth = () => {
    void Promise.all([catalog.refetch(), earned.refetch()]);
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
    const earnedById = new Map(
      earned.data.map((item) => [item.achievementId, item]),
    );
    content = (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {catalog.data.map((catalogItem) => {
          const earnedItem = earnedById.get(catalogItem.id);
          return earnedItem === undefined ? (
            <AchievementCard
              achievement={catalogItem}
              key={catalogItem.id}
              unlocked={false}
            />
          ) : (
            <AchievementCard
              achievement={earnedItem}
              key={catalogItem.id}
              unlocked
            />
          );
        })}
      </ul>
    );
  }

  return (
    <section aria-labelledby="passport-achievements-heading" className="mt-10">
      <p className="kiwi-stat-label">Milestones</p>
      <h2 className="mt-1 text-2xl" id="passport-achievements-heading">Achievements</h2>
      <div className="mt-4">{content}</div>
    </section>
  );
}

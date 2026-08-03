import type {
  AchievementProfile,
  AchievementRarity,
  AchievementTrophyTier,
} from '../../types/achievement.ts';
import { TrophyArtwork } from '../game/GameArtwork.tsx';

export default function TrophyProgressCard({
  profile,
}: {
  profile: AchievementProfile;
}) {
  const { trophy } = profile;
  const isLocked = trophy.tier === 'Locked';
  const target = trophy.nextRequiredCount ?? trophy.requiredCount;
  const remaining = Math.max(target - profile.earnedDistinctCount, 0);
  const progressMaximum = Math.max(target, 1);

  return (
    <section
      aria-labelledby="achievement-trophy-heading"
      className={`mt-6 rounded-3xl border p-5 ${TROPHY_CARD_STYLES[trophy.tier]}`}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-base-100/70 shadow-sm">
          <TrophyArtwork tier={trophy.tier} size={58} />
        </span>
        <div>
          <p className="kiwi-stat-label">Achievement trophy</p>
          <h2 className="mt-1 text-xl" id="achievement-trophy-heading">
            {isLocked
              ? `${trophy.nextTier ?? 'Bronze'} trophy is next`
              : `${trophy.tier} Trophy`}
          </h2>
          <progress
            aria-label={`${profile.earnedDistinctCount} of ${target} distinct achievements`}
            className="progress progress-primary mt-3 w-full"
            max={progressMaximum}
            value={Math.min(profile.earnedDistinctCount, progressMaximum)}
          />
          <p className="mt-2 text-sm text-muted-content">
            {profile.earnedDistinctCount} distinct achievements earned
            {' · '}
            {profile.activeAchievementCount} currently active
          </p>
          {!isLocked && (
            <p className="mt-2 text-xs text-muted-content">
              {trophy.nationwideEarnedCount.toLocaleString()}{' '}
              {trophy.nationwideEarnedCount === 1 ? 'member has' : 'members have'}{' '}
              reached {trophy.tier} or higher nationwide
              {' · '}
              {formatPercentage(
                trophy.nationwideEarnedCount,
                trophy.earnedPercentage,
              )}
              {' · '}
              {RARITY_LABELS[trophy.rarity]}
            </p>
          )}
        </div>
        <span className="inline-flex justify-center rounded-full bg-base-100/75 px-3 py-2 text-xs font-bold">
          {trophy.nextTier === null
            ? 'Highest trophy lit'
            : `${remaining} to ${trophy.nextTier}`}
        </span>
      </div>
    </section>
  );
}

const TROPHY_CARD_STYLES: Record<AchievementTrophyTier, string> = {
  Locked: 'border-base-300 bg-base-100',
  Bronze: 'border-orange-300/70 bg-orange-50/70 dark:bg-orange-950/20',
  Silver: 'border-slate-300 bg-slate-50/80 dark:bg-slate-900/35',
  Gold: 'border-amber-300 bg-amber-50/75 dark:bg-amber-950/20',
  Platinum: 'border-cyan-300 bg-cyan-50/75 dark:bg-cyan-950/20',
  Diamond: 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/25',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  Unawarded: 'Unawarded',
  UltraRare: 'Ultra rare',
  Rare: 'Rare',
  Uncommon: 'Uncommon',
  Common: 'Common',
};

function formatPercentage(count: number, percentage: number): string {
  if (count > 0 && percentage < 0.01) return '<0.01%';
  return `${percentage.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}%`;
}

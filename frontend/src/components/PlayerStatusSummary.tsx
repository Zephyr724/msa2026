import {
  Flame,
  Home,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useMyProfile, useWeeklyStreak } from '../hooks/useCommunity.ts';
import { usePeopleLeaderboard } from '../hooks/useLeaderboard.ts';
import { useProgression } from '../hooks/useProgression.ts';
import { deriveLevelProgress } from '../lib/progressionRules.ts';
import { RankCrest } from './game/GameArtwork.tsx';

export default function PlayerStatusSummary() {
  const auth = useAuthQuery();
  const progression = useProgression();
  const profile = useMyProfile();
  const streak = useWeeklyStreak();
  const communityLeaderboard = usePeopleLeaderboard(
    'myCommunity',
    'weekly',
    // Avoid an unauthorized or meaningless community request until the
    // profile confirms that the member has selected a Home Community.
    Boolean(profile.data?.homeCommunity),
  );
  const aucklandLeaderboard = usePeopleLeaderboard('auckland', 'weekly');
  const [showLevelDetails, setShowLevelDetails] = useState(false);
  const communityRank = communityLeaderboard.data?.rows
    .find((row) => row.isCurrentUser)?.rank;
  const aucklandRank = aucklandLeaderboard.data?.rows
    .find((row) => row.isCurrentUser)?.rank;

  return (
    <>
      <section
        aria-labelledby="player-status-title"
        className="kiwi-panel kiwi-topography relative overflow-hidden p-6"
      >
        <div className="relative grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <RankCrest rankTitle={progression.data?.rankTitle ?? 'Novice'} size={56} />
          <div className="min-w-0">
            <p className="kiwi-stat-label">Player status</p>
            <h2 className="mt-1 text-xl" id="player-status-title">
              {auth.data?.displayName ?? 'Your progress'}
            </h2>
            {progression.isPending && (
              <p aria-live="polite" className="mt-3 text-sm text-muted-content">
                Loading your level and XP…
              </p>
            )}
            {progression.isError && (
              <p className="mt-3 text-sm text-muted-content">
                Progress is temporarily unavailable.
              </p>
            )}
            {progression.data && (
              <ProgressDetails
                aucklandRank={aucklandRank}
                communityName={profile.data?.homeCommunity?.name}
                communityRank={communityRank}
                level={progression.data.level}
                onOpenLevelDetails={() => setShowLevelDetails(true)}
                rankTitle={progression.data.rankTitle}
                totalXp={progression.data.totalXp}
              />
            )}
          </div>
          <div className="flex gap-3 sm:col-start-2 lg:col-start-auto lg:flex-col">
            <div className="group relative">
              <button
                aria-describedby="weekly-streak-help"
                className="min-w-32 rounded-2xl border border-base-300 bg-secondary px-4 py-2.5 text-center transition-colors hover:border-amber-200 hover:bg-amber-50 dark:hover:border-amber-700 dark:hover:bg-amber-900/30"
                type="button"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Flame aria-hidden="true" className="size-4 text-orange-500" />
                  <strong className="kiwi-display text-lg">
                    {streak.data?.currentWeeks ?? (streak.isPending ? '…' : 0)}
                  </strong>
                </span>
                <span className="mt-0.5 block text-xs text-muted-content">Week streak</span>
              </button>
              <div
                className="absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-xl bg-neutral p-3 text-xs text-neutral-content shadow-xl group-focus-within:block group-hover:block"
                id="weekly-streak-help"
                role="tooltip"
              >
                Complete at least one verified Quest each week. Completion codes
                and approved evidence count; self-reports do not.
              </div>
            </div>
            <Link
              className="min-w-32 rounded-2xl border border-base-300 bg-secondary px-4 py-2.5 text-center transition-colors hover:border-primary/30 hover:bg-primary/8"
              to="/leaderboard?scope=myCommunity&period=weekly"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Trophy aria-hidden="true" className="size-4 text-amber-500" />
                <strong className="kiwi-display text-lg">
                  {communityRank ? `#${communityRank}` : '—'}
                </strong>
              </span>
              <span className="mt-0.5 block max-w-32 truncate text-xs text-muted-content">
                {profile.data?.homeCommunity?.name ?? 'Choose community'}
              </span>
            </Link>
          </div>
        </div>
      </section>
      {showLevelDetails && progression.data && (
        <LevelDetailsDialog
          level={progression.data.level}
          onClose={() => setShowLevelDetails(false)}
          rankTitle={progression.data.rankTitle}
          totalXp={progression.data.totalXp}
        />
      )}
    </>
  );
}

function ProgressDetails({
  aucklandRank,
  communityName,
  communityRank,
  level,
  onOpenLevelDetails,
  rankTitle,
  totalXp,
}: {
  aucklandRank?: number;
  communityName?: string;
  communityRank?: number;
  level: number;
  onOpenLevelDetails: () => void;
  rankTitle: string;
  totalXp: number;
}) {
  const levelProgress = deriveLevelProgress(totalXp, level);
  const progress = levelProgress.nextFloor === null
    ? 100
    : (levelProgress.currentLevelXp / levelProgress.levelSpanXp!) * 100;

  return (
    <>
      <p className="mt-1 font-semibold text-muted-content">
        <button
          className="font-bold text-primary underline-offset-2 hover:underline"
          onClick={onOpenLevelDetails}
          title="View level and rank details"
          type="button"
        >
          Level {level}
        </button>
        {' · '}
        <span className="font-bold text-base-content">{rankTitle}</span>
      </p>
      <div className="mt-3 max-w-sm">
        <div className="flex items-center justify-between gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5">
            <Zap aria-hidden="true" className="size-4 text-amber-600 dark:text-amber-400" />
            {totalXp} XP
          </span>
          <span className="text-muted-content">
            {levelProgress.nextFloor === null
              ? 'Maximum level'
              : `${levelProgress.nextFloor} XP next level`}
          </span>
        </div>
        <progress
          aria-label={`Level ${level} progress`}
          className="progress progress-primary mt-2 h-2.5 w-full"
          max="100"
          value={progress}
        />
      </div>
      <p className="mt-2 text-xs text-muted-content">
        {communityName && communityRank
          ? `#${communityRank} in ${communityName} this week · `
          : ''}
        {aucklandRank ? `#${aucklandRank} Auckland` : 'Auckland rank will appear after verified XP'}
      </p>
    </>
  );
}

const RANK_LADDER = [
  ['Novice', 'Levels 1–9'],
  ['Scout', 'Levels 10–19'],
  ['Adventurer', 'Levels 20–29'],
  ['Ranger', 'Levels 30–39'],
  ['Pathfinder', 'Levels 40–49'],
  ['Guardian', 'Levels 50–59'],
  ['Vanguard', 'Levels 60–69'],
  ['Champion', 'Levels 70–79'],
  ['Hero', 'Levels 80–89'],
  ['Legend', 'Levels 90–98'],
  ['Kiwimpact Legend', 'Level 99'],
] as const;

function LevelDetailsDialog({
  level,
  onClose,
  rankTitle,
  totalXp,
}: {
  level: number;
  onClose: () => void;
  rankTitle: string;
  totalXp: number;
}) {
  const progress = deriveLevelProgress(totalXp, level);
  return (
    <div
      aria-labelledby="level-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid items-end bg-neutral/45 backdrop-blur-sm sm:place-items-center"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-base-100 p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl" id="level-details-title">Level &amp; Rank</h2>
          <button
            aria-label="Close level details"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-secondary p-4">
          <RankCrest rankTitle={rankTitle} size={52} />
          <div className="min-w-0 flex-1">
            <p className="kiwi-stat-label">Current rank</p>
            <h3 className="mt-1 text-lg">{rankTitle} · Level {level}</h3>
            <p className="mt-1 text-xs text-muted-content">
              {progress.xpToNextLevel === null
                ? `${totalXp} XP · maximum level`
                : `${totalXp} XP · ${progress.xpToNextLevel} XP to Level ${level + 1}`}
            </p>
          </div>
        </div>
        <p className="kiwi-stat-label mt-5">Full rank ladder</p>
        <div className="mt-3 grid gap-2">
          {RANK_LADDER.map(([title, levels]) => (
            <div
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                title === rankTitle
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-base-300'
              }`}
              key={title}
            >
              <RankCrest rankTitle={title} size={36} />
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{title}</strong>
                <span className="block text-xs text-muted-content">{levels}</span>
              </span>
              {title === rankTitle && (
                <span className="badge badge-primary badge-outline badge-sm">You are here</span>
              )}
            </div>
          ))}
        </div>
        <Link
          className="btn btn-outline mt-5 w-full"
          onClick={onClose}
          to="/settings/profile"
        >
          <Home aria-hidden="true" className="size-4" />
          Profile &amp; community settings
        </Link>
      </div>
    </div>
  );
}

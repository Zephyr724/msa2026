import { Zap } from 'lucide-react';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useProgression } from '../hooks/useProgression.ts';
import { deriveLevelProgress } from '../lib/progressionRules.ts';
import { RankCrest } from './game/GameArtwork.tsx';

export default function PlayerStatusSummary() {
  const auth = useAuthQuery();
  const progression = useProgression();

  return (
    <section
      aria-labelledby="player-status-title"
      className="kiwi-panel kiwi-topography grid gap-4 overflow-hidden p-5 sm:grid-cols-[auto_1fr] sm:items-center"
    >
      <span className="grid size-16 place-items-center rounded-[1.1rem] border border-primary/15 bg-secondary shadow-sm">
        <RankCrest rankTitle={progression.data?.rankTitle ?? 'Novice'} size={48} />
      </span>
      <div>
        <p className="kiwi-stat-label">Player status</p>
        <h2 className="mt-1 text-2xl" id="player-status-title">
          {auth.data?.displayName ?? 'Your progress'}
        </h2>
        {progression.isPending && (
          <p aria-live="polite" className="mt-3 text-sm text-base-content/60">
            Loading your level and XP…
          </p>
        )}
        {progression.isError && (
          <p className="mt-3 text-sm text-base-content/60">
            Progress is temporarily unavailable.
          </p>
        )}
        {progression.data && (
          <ProgressDetails
            level={progression.data.level}
            rankTitle={progression.data.rankTitle}
            totalXp={progression.data.totalXp}
          />
        )}
      </div>
    </section>
  );
}

function ProgressDetails({
  level,
  rankTitle,
  totalXp,
}: {
  level: number;
  rankTitle: string;
  totalXp: number;
}) {
  const levelProgress = deriveLevelProgress(totalXp, level);
  const progress = levelProgress.nextFloor === null
    ? 100
    : (levelProgress.currentLevelXp / levelProgress.levelSpanXp!) * 100;

  return (
    <>
      <p className="mt-1 font-semibold text-base-content/65">
        Level {level} · {rankTitle}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold">
        <span className="inline-flex items-center gap-1.5">
          <Zap aria-hidden="true" className="size-4 text-warning" />
          {totalXp} XP
        </span>
        <span className="text-base-content/50">
          {levelProgress.nextFloor === null
            ? 'Maximum level'
            : `${levelProgress.nextFloor} XP next level`}
        </span>
      </div>
      <progress
        aria-label={`Level ${level} progress`}
        className="progress progress-primary mt-2 h-2 w-full"
        max="100"
        value={progress}
      />
    </>
  );
}

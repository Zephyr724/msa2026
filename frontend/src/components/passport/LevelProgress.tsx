import type { MyProgression } from '../../types/progression.ts';
import { deriveLevelProgress } from '../../lib/progressionRules.ts';

/**
 * Level progress in the single within-level unit (M2): the bar, its visible
 * fraction, and its ARIA values all use currentLevelXp over levelSpanXp.
 * Total XP is rendered only as its own statistic by the parent card. The
 * payload was validated against the mirror, so derivation cannot throw here.
 */
export default function LevelProgress({
  progression,
}: {
  progression: MyProgression;
}) {
  const progress = deriveLevelProgress(progression.totalXp, progression.level);
  const nextLevel = progression.level + 1;

  if (progress.levelSpanXp === null) {
    return (
      <div>
        <progress
          aria-label="Level progress"
          aria-valuemax={1}
          aria-valuemin={0}
          aria-valuenow={1}
          aria-valuetext="Maximum level reached"
          className="progress progress-success w-full"
          max={1}
          value={1}
        />
        <p className="mt-2 text-sm">Maximum level reached</p>
      </div>
    );
  }

  return (
    <div>
      <progress
        aria-label={`Progress toward Level ${nextLevel}`}
        aria-valuemax={progress.levelSpanXp}
        aria-valuemin={0}
        aria-valuenow={progress.currentLevelXp}
        aria-valuetext={`${progress.currentLevelXp} of ${progress.levelSpanXp} XP toward Level ${nextLevel}`}
        className="progress progress-success w-full"
        max={progress.levelSpanXp}
        value={progress.currentLevelXp}
      />
      <p className="mt-2 text-sm">
        {progress.currentLevelXp} / {progress.levelSpanXp} XP toward Level {nextLevel}
      </p>
      <p className="text-sm text-base-content/70">
        {progress.xpToNextLevel} XP to Level {nextLevel}
      </p>
    </div>
  );
}

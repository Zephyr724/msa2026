import type { MyProgression } from '../../types/progression.ts';
import LevelProgress from './LevelProgress.tsx';

/**
 * Summary card for the server-authoritative progression state. Total XP is
 * its own statistic; level progress uses within-level units only (M2).
 */
export default function PassportSummaryCard({
  progression,
}: {
  progression: MyProgression;
}) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge badge-primary badge-lg">
            Level {progression.level}
          </span>
          <span className="text-lg font-semibold">{progression.rankTitle}</span>
        </div>
        <p className="text-sm">
          Total XP: <span className="font-semibold">{progression.totalXp} XP</span>
        </p>
        <LevelProgress progression={progression} />
      </div>
    </div>
  );
}

import type { MyProgression } from '../../types/progression.ts';
import { CheckCircle2, Shield, Zap } from 'lucide-react';
import LevelProgress from './LevelProgress.tsx';

/**
 * Summary card for the server-authoritative progression state. Total XP is
 * its own statistic; level progress uses within-level units only (M2).
 */
export default function PassportSummaryCard({
  displayName,
  progression,
}: {
  displayName?: string;
  progression: MyProgression;
}) {
  return (
    <div className="kiwi-topography overflow-hidden rounded-[1.75rem] bg-primary p-6 text-primary-content shadow-xl sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <span className="grid size-20 place-items-center rounded-[1.4rem] border border-white/20 bg-white/12">
          <Shield aria-hidden="true" className="size-9" />
        </span>
        <div>
          {displayName && <p className="kiwi-display text-3xl text-white">{displayName}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-lg">
            <span className="font-bold">Level {progression.level}</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{progression.rankTitle}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-primary-content/80">
            <span className="inline-flex items-center gap-2">
              <Zap aria-hidden="true" className="size-4 text-accent" />
              Total XP: <strong className="text-white">{progression.totalXp} XP</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              Verified progress
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 [&_.progress]:bg-white/20 [&_.progress::-webkit-progress-value]:bg-accent">
        <p className="kiwi-stat-label !text-primary-content/65">Level progress</p>
        <div className="mt-3 text-primary-content/85">
          <LevelProgress progression={progression} />
        </div>
      </div>
    </div>
  );
}

import type { MyProgression } from '../../types/progression.ts';
import type { PassportSummary } from '../../types/passport.ts';
import { CheckCircle2, Flame, Home, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deriveLevelProgress } from '../../lib/progressionRules.ts';
import { RankCrest } from '../game/GameArtwork.tsx';

/**
 * Summary card for the server-authoritative progression state. Total XP is
 * its own statistic; level progress uses within-level units only (M2).
 */
export default function PassportSummaryCard({
  displayName,
  passport,
  progression,
  streakWeeks,
}: {
  displayName?: string;
  passport?: PassportSummary;
  progression: MyProgression;
  streakWeeks?: number;
}) {
  const levelProgress = deriveLevelProgress(progression.totalXp, progression.level);
  const nextLevel = progression.level + 1;

  return (
    <div className="kiwi-topography overflow-hidden rounded-3xl bg-primary p-6 text-primary-content shadow-sm">
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <RankCrest rankTitle={progression.rankTitle} size={64} />
        <div>
          {displayName && <p className="kiwi-display text-2xl">{displayName}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-base">
            <span className="font-bold">Level {progression.level}</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{progression.rankTitle}</span>
            {passport?.homeCommunity && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-content/20 bg-primary-content/20 px-2.5 py-1 text-xs font-bold">
                <Home aria-hidden="true" className="size-3" />
                {passport.homeCommunity.name} Contributor
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary-content/80">
            <span className="inline-flex items-center gap-2">
              <Zap aria-hidden="true" className="size-4 text-accent" />
              Total XP: <strong>{progression.totalXp} XP</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {passport
                ? `${passport.verifiedCompletionCount} verified ${
                  passport.verifiedCompletionCount === 1 ? 'Quest' : 'Quests'
                }`
                : 'Verified progress'}
            </span>
            {streakWeeks !== undefined && (
              <span className="inline-flex items-center gap-2">
                <Flame aria-hidden="true" className="size-4 text-accent" />
                {streakWeeks}-week streak
              </span>
            )}
          </div>
        </div>
        <div className="w-full space-y-1.5 sm:col-start-2 lg:col-start-auto lg:w-52">
          {levelProgress.levelSpanXp === null ? (
            <>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-primary-content/70">XP progress</span>
                <strong>Maximum</strong>
              </div>
              <XpProgressBar
                label="Level progress"
                max={1}
                value={1}
                valueText="Maximum level reached"
              />
              <p className="text-right text-xs text-primary-content/60">
                Maximum level reached
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-primary-content/70">XP progress</span>
                <strong>
                  {levelProgress.currentLevelXp} / {levelProgress.levelSpanXp}
                </strong>
              </div>
              <XpProgressBar
                label={`Progress toward Level ${nextLevel}`}
                max={levelProgress.levelSpanXp}
                value={levelProgress.currentLevelXp}
                valueText={`${levelProgress.currentLevelXp} of ${levelProgress.levelSpanXp} XP toward Level ${nextLevel}`}
              />
              <p className="text-right text-xs text-primary-content/60">
                {levelProgress.currentLevelXp} / {levelProgress.levelSpanXp} XP toward Level {nextLevel}
              </p>
              <p className="text-right text-xs text-primary-content/60">
                {levelProgress.xpToNextLevel} XP to Level {nextLevel}
              </p>
            </>
          )}
        </div>
      </div>
      {passport?.homeCommunity && (
        <Link
          className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-primary-content/10 bg-primary-content/10 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-content/20"
          to="/leaderboard?scope=myCommunity&period=weekly"
        >
          <Trophy aria-hidden="true" className="size-4 shrink-0 text-accent" />
          <span>
            <strong className="block text-xs">View {passport.homeCommunity.name} leaderboard</strong>
            <span className="block text-[0.68rem] text-primary-content/60">
              Compare this week&apos;s verified impact
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}

function XpProgressBar({
  label,
  max,
  value,
  valueText,
}: {
  label: string;
  max: number;
  value: number;
  valueText: string;
}) {
  const percentage = max <= 0 ? 0 : Math.min(100, (value / max) * 100);

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className="h-2.5 w-full overflow-hidden rounded-full bg-base-300"
      role="progressbar"
    >
      <span
        aria-hidden="true"
        className="block h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

import type { MyProgression } from '../../types/progression.ts';
import type { PassportSummary } from '../../types/passport.ts';
import { CheckCircle2, Flame, Home, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import LevelProgress from './LevelProgress.tsx';
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
  return (
    <div className="kiwi-topography overflow-hidden rounded-[1.25rem] bg-primary p-5 text-primary-content shadow-sm sm:p-6">
      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <span className="grid size-16 place-items-center rounded-[1rem] border border-white/20 bg-white/12">
          <RankCrest rankTitle={progression.rankTitle} size={50} />
        </span>
        <div>
          {displayName && <p className="kiwi-display text-2xl text-white">{displayName}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-base">
            <span className="font-bold">Level {progression.level}</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{progression.rankTitle}</span>
            {passport?.homeCommunity && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-bold">
                <Home aria-hidden="true" className="size-3" />
                {passport.homeCommunity.name} Contributor
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary-content/80">
            <span className="inline-flex items-center gap-2">
              <Zap aria-hidden="true" className="size-4 text-accent" />
              Total XP: <strong className="text-white">{progression.totalXp} XP</strong>
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
      </div>
      <div className="mt-5 rounded-xl border border-white/15 bg-white/10 p-3 [&_.progress]:bg-white/20 [&_.progress::-webkit-progress-value]:bg-accent">
        <p className="kiwi-stat-label !text-primary-content/65">Level progress</p>
        <div className="mt-3 text-primary-content/85">
          <LevelProgress progression={progression} />
        </div>
      </div>
      {passport?.homeCommunity && (
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold transition-colors hover:bg-white/15"
          to="/leaderboard?scope=myCommunity&period=weekly"
        >
          <Trophy aria-hidden="true" className="size-4 text-accent" />
          View {passport.homeCommunity.name} leaderboard
        </Link>
      )}
    </div>
  );
}

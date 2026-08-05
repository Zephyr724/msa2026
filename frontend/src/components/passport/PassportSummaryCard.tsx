import type { MyProgression } from '../../types/progression.ts';
import type { PassportSummary } from '../../types/passport.ts';
import type { AchievementCosmetics } from '../../types/achievement.ts';
import { CheckCircle2, Flame, Home, Sparkles, Trophy } from 'lucide-react';
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
  cosmetics,
}: {
  displayName?: string;
  passport?: PassportSummary;
  progression: MyProgression;
  streakWeeks?: number;
  cosmetics?: AchievementCosmetics;
}) {
  const levelProgress = deriveLevelProgress(progression.totalXp, progression.level);
  const nextLevel = progression.level + 1;
  const passportBorderStyle = cosmetics?.passportBorderStyle
    ? PASSPORT_BORDER_STYLES[cosmetics.passportBorderStyle] ?? ''
    : '';
  const avatarFrameStyle = cosmetics?.avatarFrameStyle
    ? AVATAR_FRAME_STYLES[cosmetics.avatarFrameStyle] ?? ''
    : '';
  const badgeStamps = (cosmetics?.badgeStampStyles ?? [])
    .filter((style) => BADGE_STAMP_LABELS[style] !== undefined);

  return (
    <div
      className={`kiwi-topography overflow-hidden rounded-3xl bg-primary p-6 text-primary-content shadow-sm ${passportBorderStyle}`}
      data-passport-border={cosmetics?.passportBorderStyle ?? undefined}
    >
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span
          className={`grid size-[4.75rem] place-items-center rounded-[1.6rem] p-1 ${avatarFrameStyle}`}
          data-avatar-frame={cosmetics?.avatarFrameStyle ?? undefined}
        >
          <RankCrest rankTitle={progression.rankTitle} size={64} />
        </span>
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
              <Sparkles aria-hidden="true" className="size-4 text-accent" />
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
          {badgeStamps.length > 0 && (
            <div
              aria-label="Unlocked Passport badge stamps"
              className="mt-3 flex flex-wrap gap-2"
            >
              {badgeStamps.map((style) => (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold ${BADGE_STAMP_STYLES[style]}`}
                  key={style}
                >
                  <span aria-hidden="true">✦</span>
                  {BADGE_STAMP_LABELS[style]}
                </span>
              ))}
            </div>
          )}
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

const PASSPORT_BORDER_STYLES: Record<string, string> = {
  forest: 'ring-4 ring-emerald-300/60 shadow-[0_18px_50px_rgba(16,120,72,0.22)]',
  kauri: 'ring-4 ring-amber-300/70 shadow-[0_18px_55px_rgba(180,120,20,0.24)]',
  ocean: 'ring-4 ring-cyan-300/70 shadow-[0_18px_55px_rgba(24,145,180,0.24)]',
  aurora: 'ring-4 ring-violet-300/70 shadow-[0_18px_60px_rgba(110,80,210,0.28)]',
};

const AVATAR_FRAME_STYLES: Record<string, string> = {
  sprout: 'bg-gradient-to-br from-lime-200 via-emerald-300 to-green-600 shadow-lg',
  ember: 'bg-gradient-to-br from-amber-200 via-orange-400 to-red-600 shadow-lg',
  guardian: 'bg-gradient-to-br from-cyan-200 via-sky-400 to-indigo-700 shadow-xl',
};

const BADGE_STAMP_LABELS: Record<string, string> = {
  explorer: 'Eco Explorer',
  community: 'Community Catalyst',
  legend: 'Kiwimpact Legend',
};

const BADGE_STAMP_STYLES: Record<string, string> = {
  explorer: 'border-emerald-100/35 bg-emerald-950/20 text-emerald-50',
  community: 'border-amber-100/35 bg-amber-950/20 text-amber-50',
  legend: 'border-violet-100/40 bg-violet-950/25 text-violet-50',
};

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

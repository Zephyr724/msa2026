import { useState } from 'react';
import type {
  AchievementCatalogItem,
  AchievementNationwideStat,
  AchievementRarity,
  EarnedAchievement,
} from '../../types/achievement.ts';
import { AchievementBadgeArt } from '../game/GameArtwork.tsx';

function guardedIconUrl(iconUrl: string | null): string | null {
  if (iconUrl === null) return null;
  try {
    const url = new URL(iconUrl);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function AchievementIcon({
  code,
  iconUrl,
  label,
  muted,
}: {
  code: string;
  iconUrl: string | null;
  label: string;
  muted: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeIconUrl = guardedIconUrl(iconUrl);

  if (safeIconUrl !== null && !imageFailed) {
    return (
      <img
        alt=""
        className={`size-8 object-contain ${muted ? 'opacity-40' : ''}`}
        loading="lazy"
        onError={() => setImageFailed(true)}
        referrerPolicy="no-referrer"
        src={safeIconUrl}
      />
    );
  }

  return (
    <AchievementBadgeArt
      code={code}
      label={label}
      size={52}
      unlocked={!muted}
    />
  );
}

type AchievementCardProps =
  | {
      achievement: AchievementCatalogItem;
      rarityUnavailable?: boolean;
      stat?: AchievementNationwideStat;
      unlocked: false;
    }
  | {
      achievement: EarnedAchievement;
      rarityUnavailable?: boolean;
      stat?: AchievementNationwideStat;
      unlocked: true;
    };

export default function AchievementCard(props: AchievementCardProps) {
  const {
    achievement,
    rarityUnavailable = false,
    stat,
    unlocked,
  } = props;

  return (
    <li className={`kiwi-card-hover card overflow-hidden border bg-base-100 ${
      unlocked ? 'border-primary/35 shadow-sm' : 'border-base-300'
    }`}>
      <div className="card-body gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-16 place-items-center">
            <AchievementIcon
              key={`${achievement.code}:${achievement.iconUrl ?? ''}`}
              code={achievement.code}
              iconUrl={achievement.iconUrl}
              label={achievement.name}
              muted={!unlocked}
            />
          </span>
          <span
            className={unlocked
              ? 'badge badge-success'
              : 'badge badge-outline'}
          >
            {unlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>
        <div>
          <h3 className="text-lg">{achievement.name}</h3>
          <p className="mt-1 text-sm text-muted-content">
            {achievement.description}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="badge badge-ghost">{achievement.category}</span>
          {unlocked && (
            <time dateTime={props.achievement.awardedAt}>
              Unlocked {new Date(props.achievement.awardedAt).toLocaleDateString()}
            </time>
          )}
        </div>
        <div className="border-t border-base-300/70 pt-3">
          {stat === undefined ? (
            <p className="text-xs text-muted-content">
              {rarityUnavailable
                ? 'Nationwide rarity is unavailable.'
                : 'Nationwide rarity is being calculated…'}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-content">
                {stat.nationwideEarnedCount === 0
                  ? 'No members nationwide yet'
                  : `${stat.nationwideEarnedCount.toLocaleString()} ${
                    stat.nationwideEarnedCount === 1 ? 'member' : 'members'
                  } nationwide`}
                {' · '}
                {formatPercentage(
                  stat.nationwideEarnedCount,
                  stat.earnedPercentage,
                )}
              </p>
              <span className={`badge badge-sm ${RARITY_STYLES[stat.rarity]}`}>
                {RARITY_LABELS[stat.rarity]}
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

const RARITY_LABELS: Record<AchievementRarity, string> = {
  Unawarded: 'Unawarded',
  UltraRare: 'Ultra rare',
  Rare: 'Rare',
  Uncommon: 'Uncommon',
  Common: 'Common',
};

const RARITY_STYLES: Record<AchievementRarity, string> = {
  Unawarded: 'badge-ghost',
  UltraRare: 'border-violet-400 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  Rare: 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  Uncommon: 'border-sky-300 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  Common: 'badge-outline',
};

function formatPercentage(earnedCount: number, percentage: number): string {
  if (earnedCount > 0 && percentage < 0.01) return '<0.01%';
  return `${percentage.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}%`;
}

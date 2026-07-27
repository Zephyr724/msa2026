import { useState } from 'react';
import type {
  AchievementCatalogItem,
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
      unlocked: false;
    }
  | {
      achievement: EarnedAchievement;
      unlocked: true;
    };

export default function AchievementCard(props: AchievementCardProps) {
  const { achievement, unlocked } = props;

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
          <p className="mt-1 text-sm text-base-content/70">
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
      </div>
    </li>
  );
}

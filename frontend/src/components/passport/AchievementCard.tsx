import { useState, type ComponentType } from 'react';
import {
  Award,
  Footprints,
  Medal,
  TrendingUp,
  type LucideProps,
} from 'lucide-react';
import type {
  AchievementCatalogItem,
  EarnedAchievement,
} from '../../types/achievement.ts';

const ICONS_BY_CODE: Record<string, ComponentType<LucideProps>> = {
  'verified-completions-1': Footprints,
  'verified-completions-3': TrendingUp,
  'verified-completions-5': Medal,
};

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
  muted,
}: {
  code: string;
  iconUrl: string | null;
  muted: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = ICONS_BY_CODE[code] ?? Award;
  const safeIconUrl = guardedIconUrl(iconUrl);
  const className = `size-9 ${muted ? 'text-base-content/35' : 'text-primary'}`;

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
    <Icon
      aria-hidden="true"
      className={className}
      focusable="false"
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
      unlocked ? 'border-primary/35' : 'border-base-300'
    }`}>
      <div className="card-body gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`grid size-14 place-items-center rounded-2xl ${
            unlocked ? 'bg-primary/12' : 'bg-secondary'
          }`}>
            <AchievementIcon
              key={`${achievement.code}:${achievement.iconUrl ?? ''}`}
              code={achievement.code}
              iconUrl={achievement.iconUrl}
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

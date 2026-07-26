import { ArrowRight, CalendarDays, MapPin, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuestListItemDto } from '../../types/quest.ts';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_LABELS,
  formatQuestDate,
  REGISTRATION_LABELS,
  SOURCE_LABELS,
} from '../../lib/questPresentation.ts';
import CategoryEmblem from './CategoryEmblem.tsx';

const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

interface QuestCardProps {
  quest: QuestListItemDto;
  statusLabel?: string;
}

export default function QuestCard({ quest, statusLabel }: QuestCardProps) {
  const [imageSrc, setImageSrc] = useState(
    quest.coverImage?.imageUrl ?? QUEST_IMAGE_FALLBACK,
  );
  const isFallback = imageSrc === QUEST_IMAGE_FALLBACK;
  const category = CATEGORY_PRESENTATION[quest.category];

  return (
    <article className="kiwi-card-hover group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-base-300 bg-base-100">
      <Link className="relative block overflow-hidden" to={`/quests/${quest.id}`}>
        <figure className="h-48 bg-base-200 sm:h-52">
          <img
            alt={isFallback
              ? `Fallback illustration for ${quest.title}`
              : quest.coverImage!.altText}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageSrc(QUEST_IMAGE_FALLBACK)}
            src={imageSrc}
          />
        </figure>
        {statusLabel && (
          <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-base-100/95 px-2.5 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
            {statusLabel}
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/50 bg-base-100/95 px-2.5 py-1 text-xs font-extrabold text-base-content shadow-sm backdrop-blur">
          <Zap aria-hidden="true" className="size-3.5 text-warning" />
          {quest.xpAward} XP
        </span>
        <span className="absolute -bottom-5 left-4">
          <CategoryEmblem category={quest.category} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
        <p className="mb-1 text-[0.68rem] font-extrabold uppercase tracking-[0.11em] text-primary">
          {category.label}
        </p>
        <Link className="kiwi-display text-xl leading-tight hover:text-primary" to={`/quests/${quest.id}`}>
          {quest.title}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-base-content/65">
          {quest.description}
        </p>

        <dl className="mt-4 grid gap-2 text-sm text-base-content/70">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {quest.startAtUtc ? (
              <time className="truncate" dateTime={quest.startAtUtc}>
                {formatQuestDate(quest.startAtUtc)}
              </time>
            ) : (
              <span className="truncate">{formatQuestDate(null)}</span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {quest.locationDescription ?? quest.locationRegion?.name ?? 'Location to be confirmed'}
            </span>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="badge badge-outline">
            {DIFFICULTY_LABELS[quest.difficulty]}
          </span>
          {quest.registrationMode && (
            <span className="badge badge-outline">
              {REGISTRATION_LABELS[quest.registrationMode]}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-base-300 pt-4">
          <span className="text-xs font-semibold text-base-content/60">
            {SOURCE_LABELS[quest.sourceType]}
          </span>
          <Link
            aria-label={`View ${quest.title}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary"
            to={`/quests/${quest.id}`}
          >
            View <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

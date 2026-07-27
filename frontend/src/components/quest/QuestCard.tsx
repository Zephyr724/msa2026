import { ArrowRight, CalendarDays, Leaf, MapPin, Sparkles, Zap } from 'lucide-react';
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
  const isRepositoryPlaceholder = imageSrc.startsWith('/images/quests/')
    && imageSrc.endsWith('.svg')
    && !isFallback;
  const category = CATEGORY_PRESENTATION[quest.category];

  return (
    <article className="kiwi-card-hover group flex h-full flex-col overflow-hidden rounded-[1rem] border border-base-300 bg-base-100">
      <Link className="relative block overflow-hidden" to={`/quests/${quest.id}`}>
        <figure className="h-44 bg-base-200">
          {isRepositoryPlaceholder ? (
            <RepositoryQuestScene category={quest.category} title={quest.title} />
          ) : (
            <img
              alt={isFallback
                ? `Fallback illustration for ${quest.title}`
                : quest.coverImage!.altText}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              onError={() => setImageSrc(QUEST_IMAGE_FALLBACK)}
              src={imageSrc}
            />
          )}
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

      <div className="flex flex-1 flex-col px-4 pb-4 pt-7">
        <p className="mb-1 text-[0.68rem] font-extrabold uppercase tracking-[0.11em] text-primary">
          {category.label}
        </p>
        <Link className="kiwi-display text-lg leading-tight hover:text-primary" to={`/quests/${quest.id}`}>
          {quest.title}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-base-content/65">
          {quest.description}
        </p>

        <dl className="mt-3 grid gap-1.5 text-xs text-base-content/70">
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

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="badge badge-outline">
            {DIFFICULTY_LABELS[quest.difficulty]}
          </span>
          {quest.registrationMode && (
            <span className="badge badge-outline">
              {REGISTRATION_LABELS[quest.registrationMode]}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-base-300 pt-3">
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

export function RepositoryQuestScene({
  category,
  title,
}: Pick<QuestListItemDto, 'category' | 'title'>) {
  const sceneClasses = {
    RestoreNature: 'from-emerald-950 via-emerald-700 to-lime-300',
    ProtectWildlife: 'from-sky-950 via-blue-700 to-cyan-200',
    CleanReduceWaste: 'from-rose-950 via-orange-700 to-amber-200',
    GrowCompost: 'from-lime-950 via-lime-700 to-yellow-200',
    ObserveMeasure: 'from-violet-950 via-violet-700 to-fuchsia-200',
    LearnShare: 'from-fuchsia-950 via-purple-700 to-rose-200',
  }[category];

  return (
    <div
      aria-label={`Illustrated environmental scene for ${title}`}
      className={`relative h-full overflow-hidden bg-gradient-to-br ${sceneClasses}`}
      role="img"
    >
      <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-black/18" />
      <div className="absolute -bottom-24 right-0 size-64 rounded-full bg-white/14" />
      <div className="absolute left-[13%] top-[18%] size-20 rotate-12 rounded-[70%_30%_65%_35%] bg-white/12" />
      <div className="absolute right-[18%] top-[16%] grid size-14 place-items-center rounded-full border border-white/35 bg-white/16 text-white shadow-lg backdrop-blur-sm">
        <Sparkles aria-hidden="true" className="size-6" />
      </div>
      <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
        <Leaf aria-hidden="true" className="size-3.5" />
        Local action
      </div>
    </div>
  );
}

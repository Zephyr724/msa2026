import { ArrowRight, CalendarDays, Leaf, MapPin, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuestListItemDto } from '../../types/quest.ts';
import {
  CATEGORY_PRESENTATION,
  DIFFICULTY_LABELS,
  DIFFICULTY_TONES,
  formatQuestDate,
  REGISTRATION_LABELS,
  REGISTRATION_TONES,
  SOURCE_LABELS,
  SOURCE_TONES,
  questHighlightTone,
} from '../../lib/questPresentation.ts';
import CategoryEmblem from './CategoryEmblem.tsx';

const QUEST_IMAGE_FALLBACK = '/images/quests/quest-fallback.svg';

interface QuestCardProps {
  quest: QuestListItemDto;
  statusLabel?: string;
  highlightLabel?: string;
}

export default function QuestCard({
  quest,
  statusLabel,
  highlightLabel,
}: QuestCardProps) {
  const [imageSrc, setImageSrc] = useState(
    quest.coverImage?.imageUrl ?? QUEST_IMAGE_FALLBACK,
  );
  const isFallback = imageSrc === QUEST_IMAGE_FALLBACK;
  const isRepositoryPlaceholder = imageSrc.startsWith('/images/quests/')
    && imageSrc.endsWith('.svg')
    && !isFallback;
  const category = CATEGORY_PRESENTATION[quest.category];
  const capacityLabel = quest.availableSpots !== undefined
    && quest.availableSpots !== null
    && quest.availableSpots <= 5
    ? `Almost full · ${quest.availableSpots} left`
    : null;
  const highlight = statusLabel ?? capacityLabel ?? highlightLabel;

  return (
    <Link
      aria-label={quest.title}
      className="group block h-full rounded-[1.25rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      to={`/quests/${quest.id}`}
    >
      <article className="kiwi-card-hover flex h-full flex-col overflow-visible rounded-[1.25rem] border border-base-300 bg-base-100">
        <div className="relative">
          <figure className="h-44 overflow-hidden rounded-t-[1.2rem] bg-base-200">
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
          {highlight && (
            <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm ${questHighlightTone(highlight)}`}>
              {highlight}
            </span>
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/50 bg-base-100/95 px-2.5 py-1 text-xs font-extrabold text-base-content shadow-sm backdrop-blur">
            <Zap aria-hidden="true" className="size-3.5 text-warning" />
            {quest.xpAward} XP
          </span>
          <span className="absolute -bottom-5 left-4 z-20 drop-shadow-md">
            <CategoryEmblem category={quest.category} />
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-7">
          <span className={`mb-2 w-fit rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] ${category.softTone}`}>
            {category.label}
          </span>
          <h3 className="kiwi-display text-lg leading-tight transition-colors group-hover:text-primary">
            {quest.title}
          </h3>
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
            <div className="flex min-w-0 items-start gap-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="line-clamp-2">
                {quest.locationDescription ?? quest.locationRegion?.name ?? 'Location to be confirmed'}
              </span>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 font-bold ${DIFFICULTY_TONES[quest.difficulty]}`}>
              {DIFFICULTY_LABELS[quest.difficulty]}
            </span>
            {quest.registrationMode && (
              <span className={`rounded-full border px-2.5 py-1 font-bold ${REGISTRATION_TONES[quest.registrationMode]}`}>
                {REGISTRATION_LABELS[quest.registrationMode]}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-base-300 pt-3">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${SOURCE_TONES[quest.sourceType]}`}>
              {SOURCE_LABELS[quest.sourceType]}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
              View <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
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
      <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
        <Leaf aria-hidden="true" className="size-3.5" />
        Local action
      </div>
    </div>
  );
}

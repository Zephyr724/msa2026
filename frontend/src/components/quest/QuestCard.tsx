import { ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
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
} from '../../lib/questPresentation.ts';
import CategoryEmblem from './CategoryEmblem.tsx';
import QuestHighlightBadge from './QuestHighlightBadge.tsx';
import QuestImage from './QuestImage.tsx';

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
            <QuestImage
              alt={quest.coverImage?.altText}
              category={quest.category}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              height={440}
              loading="lazy"
              source={quest.coverImage?.imageUrl}
              title={quest.title}
              width={800}
            />
          </figure>
          {highlight && (
            <QuestHighlightBadge label={highlight} />
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700 shadow-sm backdrop-blur dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Sparkles aria-hidden="true" className="size-3.5" />
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
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-content">
            {quest.description}
          </p>

          <dl className="mt-3 grid gap-1.5 text-xs text-muted-content">
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

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between border-t border-base-300 pt-3">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${SOURCE_TONES[quest.sourceType]}`}>
                {SOURCE_LABELS[quest.sourceType]}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                View <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

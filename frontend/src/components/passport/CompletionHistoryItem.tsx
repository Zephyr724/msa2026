import {
  ArrowRight,
  Award,
  Info,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORY_PRESENTATION } from '../../lib/questPresentation.ts';
import CategoryEmblem from '../quest/CategoryEmblem.tsx';
import type { PassportCompletionItem as PassportCompletionItemData } from '../../types/passport.ts';
import QuestImage from '../quest/QuestImage.tsx';
import MissionCompletedStamp from './MissionCompletedStamp.tsx';

/**
 * One Verified completion-history row. XP renders only from the
 * authoritative XpTransaction amount; an ordinary reward-pending row shows
 * the literal "XP pending" label, never an estimated amount (D4).
 * Title/category are the Quest's current mutable fields (documented D4
 * limitation); the quest-status badge keeps a no-longer-available quest
 * honest.
 */
export default function CompletionHistoryItem({
  item,
}: {
  item: PassportCompletionItemData;
}) {
  const status = {
    Verified: { label: 'Verified' },
    Pending: { label: 'Under review' },
    Rejected: { label: 'Not verified' },
    SelfReported: { label: 'Self-reported' },
  }[item.status];
  const category = CATEGORY_PRESENTATION[item.questCategory];

  return (
    <li className="overflow-hidden rounded-[1.25rem] border border-base-300 bg-base-100">
      <article className="flex min-h-40">
        <figure className="relative w-24 shrink-0 overflow-hidden bg-base-200 sm:w-28">
          <QuestImage
            alt={item.coverImage?.altText}
            category={item.questCategory}
            className="h-full w-full object-cover"
            height={480}
            loading="lazy"
            source={item.coverImage?.imageUrl}
            title={item.questTitle}
            width={320}
          />
          {item.status === 'Verified' ? (
            <MissionCompletedStamp className="absolute inset-0 m-auto h-[5.875rem] w-[6.875rem] max-w-none text-primary opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
          ) : (
            <span
              aria-label={status.label}
              className="absolute inset-0 m-auto grid size-8 place-items-center rounded-full bg-zinc-700/85 text-white shadow-md"
              role="img"
            >
              <Info aria-hidden="true" className="size-4" strokeWidth={2.5} />
            </span>
          )}
        </figure>

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm leading-snug">{item.questTitle}</h3>
              <time
                className="mt-0.5 block text-xs text-muted-content"
                dateTime={item.completedAtUtc}
              >
                {new Date(item.completedAtUtc).toLocaleDateString()}
              </time>
            </div>
            {item.status === 'Verified' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Sparkles aria-hidden="true" className="size-3" />
                {item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`}
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-base-300 bg-base-200 px-2 py-0.5 text-xs font-semibold text-muted-content">
                {item.status === 'SelfReported' ? 'Passport only' : status.label}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${category.softTone}`}>
              <CategoryEmblem category={item.questCategory} size="xs" />
              {category.label}
            </span>
            {item.questStatus !== 'Published' && (
              <span className="rounded-full border border-base-300 bg-base-200 px-2 py-0.5 text-[0.68rem] font-semibold">
                {item.questStatus}
              </span>
            )}
            {item.achievementNames.map((name) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                key={name}
              >
                <Award aria-hidden="true" className="size-2.5" />
                {name}
              </span>
            ))}
          </div>

          {item.status === 'Verified' && (
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              <Link
                className="btn kiwi-share-action btn-xs rounded-full"
                to={`/passport/share/completion?completionId=${encodeURIComponent(item.completionId)}`}
              >
                <Share2 aria-hidden="true" className="size-3" />
                Share
              </Link>
              <Link
                className="btn btn-outline btn-xs rounded-full"
                to={`/quests/${item.questId}`}
              >
                View Quest
                <ArrowRight aria-hidden="true" className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}

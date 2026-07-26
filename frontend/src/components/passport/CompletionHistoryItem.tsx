import { CheckCircle2, Zap } from 'lucide-react';
import { CATEGORY_PRESENTATION } from '../../lib/questPresentation.ts';
import CategoryEmblem from '../quest/CategoryEmblem.tsx';
import type { PassportCompletionItem as PassportCompletionItemData } from '../../types/passport.ts';

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
  return (
    <li className="kiwi-panel grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <CategoryEmblem category={item.questCategory} size="md" />
      <div className="min-w-0">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-primary">
          {CATEGORY_PRESENTATION[item.questCategory].label}
        </p>
        <h3 className="mt-1 truncate text-lg">{item.questTitle}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
          {item.questStatus !== 'Published' && (
            <span className="badge badge-outline">{item.questStatus}</span>
          )}
          <span className="inline-flex items-center gap-1 font-bold text-success">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            Verified
          </span>
          <time dateTime={item.completedAtUtc}>
            {new Date(item.completedAtUtc).toLocaleDateString()}
          </time>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
        <Zap aria-hidden="true" className="size-4 text-warning" />
        {item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`}
      </span>
    </li>
  );
}

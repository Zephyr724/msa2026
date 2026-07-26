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
    <li className="rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold">{item.questTitle}</h3>
        <span className="text-sm font-semibold">
          {item.xpAmount === null ? 'XP pending' : `${item.xpAmount} XP`}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="badge badge-outline">{item.questCategory}</span>
        {item.questStatus !== 'Published' && (
          <span className="badge badge-outline">{item.questStatus}</span>
        )}
        <span className="badge badge-success">Verified</span>
        <time dateTime={item.completedAtUtc}>
          {new Date(item.completedAtUtc).toLocaleDateString()}
        </time>
      </div>
    </li>
  );
}

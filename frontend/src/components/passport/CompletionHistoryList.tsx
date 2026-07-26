import type { PassportCompletionItem } from '../../types/passport.ts';
import CompletionHistoryItem from './CompletionHistoryItem.tsx';

export default function CompletionHistoryList({
  items,
}: {
  items: PassportCompletionItem[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <CompletionHistoryItem key={item.completionId} item={item} />
      ))}
    </ul>
  );
}

import type { PassportCompletionItem } from '../../types/passport.ts';
import CompletionHistoryItem from './CompletionHistoryItem.tsx';

export default function CompletionHistoryList({
  items,
}: {
  items: PassportCompletionItem[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <CompletionHistoryItem key={item.completionId} item={item} />
      ))}
    </ul>
  );
}

import { CATEGORY_PRESENTATION } from '../../lib/questPresentation.ts';
import type { QuestCategory } from '../../types/quest.ts';

export default function CategoryEmblem({
  category,
  size = 'md',
}: {
  category: QuestCategory;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { Icon, tone } = CATEGORY_PRESENTATION[category];
  const sizes = {
    sm: 'size-8 rounded-xl [&>svg]:size-4',
    md: 'size-11 rounded-2xl [&>svg]:size-5',
    lg: 'size-14 rounded-2xl [&>svg]:size-6',
  };

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center shadow-sm ring-4 ring-base-100 ${tone} ${sizes[size]}`}
    >
      <Icon strokeWidth={2.4} />
    </span>
  );
}

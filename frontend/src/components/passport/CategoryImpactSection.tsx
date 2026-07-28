import type { PassportSummary } from '../../types/passport.ts';
import { QUEST_CATEGORIES } from '../../types/quest.ts';
import { CATEGORY_PRESENTATION } from '../../lib/questPresentation.ts';
import CategoryEmblem from '../quest/CategoryEmblem.tsx';

export default function CategoryImpactSection({
  summary,
}: {
  summary: PassportSummary;
}) {
  const impactByCategory = new Map(
    summary.categoryImpact.map((item) => [item.category, item]),
  );
  const maxCount = Math.max(
    1,
    ...summary.categoryImpact.map((item) => item.verifiedCompletionCount),
  );

  return (
    <section className="mt-10" aria-labelledby="category-impact-heading">
      <p className="kiwi-stat-label">Verified impact mix</p>
      <h2 className="mt-1 text-2xl" id="category-impact-heading">
        Quest category progress
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-base-content/60">
        A truthful breakdown of your verified records. Bars compare your own
        category totals; they are not targets or environmental outcome claims.
      </p>
      <div className="kiwi-panel mt-4 grid gap-y-5 p-5">
        {QUEST_CATEGORIES.map((category) => {
          const presentation = CATEGORY_PRESENTATION[category];
          const impact = impactByCategory.get(category);
          const count = impact?.verifiedCompletionCount ?? 0;
          const xp = impact?.verifiedXp ?? 0;
          return (
            <div className="flex items-center gap-3" key={category}>
              <CategoryEmblem category={category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate text-sm font-bold">{presentation.label}</h3>
                  <span className="shrink-0 text-xs font-bold">
                    {count} {count === 1 ? 'Quest' : 'Quests'}
                  </span>
                </div>
                <progress
                  aria-label={`${presentation.label}: ${count} verified completions`}
                  className="progress progress-primary mt-2 h-2 w-full"
                  max={maxCount}
                  value={count}
                />
                <p className="mt-1 text-xs text-base-content/55">{xp} verified XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

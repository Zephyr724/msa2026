import type { PassportSummary } from '../../types/passport.ts';
import { QUEST_CATEGORIES } from '../../types/quest.ts';
import { CATEGORY_PRESENTATION } from '../../lib/questPresentation.ts';
import CategoryEmblem from '../quest/CategoryEmblem.tsx';

const CATEGORY_GOALS = {
  RestoreNature: 3,
  ProtectWildlife: 1,
  CleanReduceWaste: 3,
  GrowCompost: 3,
  ObserveMeasure: 2,
  LearnShare: 3,
} as const;

const CATEGORY_PROGRESS_COLOURS = {
  RestoreNature: 'bg-[#2F8F5B]',
  ProtectWildlife: 'bg-[#3C72C9]',
  CleanReduceWaste: 'bg-[#C74444]',
  GrowCompost: 'bg-[#6C8F2F]',
  ObserveMeasure: 'bg-[#6C63D9]',
  LearnShare: 'bg-[#C963D9]',
} as const;

export default function CategoryImpactSection({
  summary,
}: {
  summary: PassportSummary;
}) {
  const impactByCategory = new Map(
    summary.categoryImpact.map((item) => [item.category, item]),
  );
  return (
    <section className="mt-10" aria-labelledby="category-impact-heading">
      <p className="kiwi-stat-label">Verified impact mix</p>
      <h2 className="mt-1 text-2xl" id="category-impact-heading">
        Quest category progress
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-content">
        Each bar shows rewarded verified Quests against the current Passport
        category goal. These are participation milestones, not environmental
        outcome claims.
      </p>
      <div className="kiwi-panel mt-4 grid gap-y-5 p-5">
        {QUEST_CATEGORIES.map((category) => {
          const presentation = CATEGORY_PRESENTATION[category];
          const impact = impactByCategory.get(category);
          const count = impact?.verifiedCompletionCount ?? 0;
          const xp = impact?.verifiedXp ?? 0;
          const target = CATEGORY_GOALS[category];
          const progress = Math.min(100, (count / target) * 100);
          return (
            <div className="flex items-center gap-3" key={category}>
              <CategoryEmblem category={category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate text-sm font-bold">{presentation.label}</h3>
                  <span className="shrink-0 text-xs font-bold">
                    {count} / {target} Quests
                  </span>
                </div>
                <div
                  aria-label={`${presentation.label}: ${count} of ${target} verified Quests`}
                  aria-valuemax={target}
                  aria-valuemin={0}
                  aria-valuenow={Math.min(count, target)}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-base-300"
                  role="progressbar"
                >
                  <span
                    className={`block h-full rounded-full ${CATEGORY_PROGRESS_COLOURS[category]}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-content">
                  <span>
                    {count >= target
                      ? 'Category goal reached'
                      : `${target - count} ${target - count === 1 ? 'Quest' : 'Quests'} to goal`}
                  </span>
                  <span>{xp} verified XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

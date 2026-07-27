import { Award, CheckCircle2, Sparkles } from 'lucide-react';
import type { PassportSummary } from '../../types/passport.ts';

const MILESTONES = [
  { count: 1, name: 'First Steps' },
  { count: 3, name: 'Building Momentum' },
  { count: 5, name: 'Committed Contributor' },
] as const;

export default function NextMilestoneCard({
  summary,
}: {
  summary: PassportSummary;
}) {
  const rewardedCompletionCount = summary.categoryImpact.reduce(
    (total, category) => total + Number(category.verifiedCompletionCount),
    0,
  );
  const next = MILESTONES.find(
    (milestone) => rewardedCompletionCount < milestone.count,
  );

  if (!next) {
    return (
      <section className="mt-6 rounded-3xl border border-primary/30 bg-primary/8 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-content">
            <CheckCircle2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="kiwi-stat-label">Current milestone path</p>
            <h2 className="mt-1 text-xl">All current completion milestones reached</h2>
            <p className="mt-1 text-sm text-base-content/62">
              New achievement families remain deferred until their rules are approved.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const current = rewardedCompletionCount;
  return (
    <section className="kiwi-panel mt-6 p-5" aria-labelledby="next-milestone-heading">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent/16 text-warning">
          <Award aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="kiwi-stat-label">Next milestone</p>
          <h2 className="mt-1 text-xl" id="next-milestone-heading">{next.name}</h2>
          <progress
            aria-label={`${current} of ${next.count} rewarded verified completions`}
            className="progress progress-primary mt-3 w-full"
            max={next.count}
            value={current}
          />
          <p className="mt-2 text-sm text-base-content/62">
            {current} / {next.count} rewarded Verified Quests
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-bold text-primary">
          <Sparkles aria-hidden="true" className="size-4" />
          {next.count - current} to go
        </span>
      </div>
    </section>
  );
}

import { Flame } from 'lucide-react';
import { useWeeklyStreak } from '../../hooks/useCommunity';

export default function WeeklyStreakCard() {
  const streak = useWeeklyStreak();
  if (streak.isPending) return <div className="skeleton h-32 rounded-3xl" />;
  if (streak.isError) return null;
  return (
    <section className="kiwi-panel flex items-center gap-4 p-5" aria-label="Weekly streak">
      <span className="grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning">
        <Flame className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="kiwi-stat-label">Verified weekly streak</p>
        <p className="mt-1 text-3xl font-extrabold">{streak.data.currentWeeks} weeks</p>
        <p className="mt-1 text-sm text-base-content/60">
          {streak.data.hasVerifiedImpactThisWeek
            ? 'This week is secured.'
            : 'Complete one verified Quest this week to keep it going.'}
        </p>
      </div>
    </section>
  );
}

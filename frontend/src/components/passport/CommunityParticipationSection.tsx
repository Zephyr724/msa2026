import { ChevronRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PassportCommunityParticipation } from '../../types/passport.ts';
import QuestImage from '../quest/QuestImage.tsx';

export default function CommunityParticipationSection({
  items,
}: {
  items: PassportCommunityParticipation[];
}) {
  return (
    <section className="mt-10" aria-labelledby="community-participation-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl" id="community-participation-heading">
          Community challenge participation
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="kiwi-panel p-8 text-center">
          <History aria-hidden="true" className="mx-auto size-8 text-primary" />
          <h3 className="mt-3 text-xl">No community challenge history yet</h3>
          <p className="mt-1 text-sm text-muted-content">
            Verified impact can appear here after you set a Home Community.
          </p>
          <Link
            className="btn btn-outline btn-sm mt-4 rounded-full border-primary text-primary"
            to="/settings/profile#community"
          >
            Community settings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              className="kiwi-panel flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center"
              key={item.community.id}
            >
              <figure className="size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <QuestImage
                  alt=""
                  category="GrowCompost"
                  className="size-full object-cover"
                  height={192}
                  source="/images/quests/community-garden.svg"
                  title={`${item.community.name} community challenge`}
                  width={192}
                />
              </figure>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm">
                    {item.community.name} community contribution
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${
                      item.isCurrentCommunity
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-300'
                    }`}
                  >
                    {item.isCurrentCommunity ? 'Current community' : 'Recorded history'}
                  </span>
                </div>
                <p className="text-xs text-muted-content">
                  {new Date(item.latestContributionAtUtc).toLocaleDateString(
                    undefined,
                    { month: 'short', year: 'numeric' },
                  )}
                  {' · '}
                  You contributed {item.verifiedCompletionCount} verified{' '}
                  {item.verifiedCompletionCount === 1 ? 'quest' : 'quests'}
                </p>
                <p className="text-xs font-semibold text-primary">
                  {item.challengesContributedTo}{' '}
                  {item.challengesContributedTo === 1 ? 'challenge' : 'challenges'} joined
                  {' · '}
                  {item.verifiedXp} verified XP
                  {item.challengeAchievementsEarned > 0
                    ? ` · ${item.challengeAchievementsEarned} challenge award${item.challengeAchievementsEarned === 1 ? '' : 's'}`
                    : ''}
                </p>
              </div>

              <Link
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
                to={item.isCurrentCommunity
                  ? '/leaderboard?scope=myCommunity'
                  : '/leaderboard?scope=auckland'}
              >
                View details
                <ChevronRight aria-hidden="true" className="size-3" />
              </Link>
            </article>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-content">
        Community challenge records are separate from your personal quest
        completions below. Historical contributions stay attributed to the
        community recorded when XP was awarded.
      </p>
    </section>
  );
}

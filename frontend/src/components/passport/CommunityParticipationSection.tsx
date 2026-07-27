import { Award, Flag, History, Zap } from 'lucide-react';
import type { PassportCommunityParticipation } from '../../types/passport.ts';

export default function CommunityParticipationSection({
  items,
}: {
  items: PassportCommunityParticipation[];
}) {
  return (
    <section className="mt-10" aria-labelledby="community-participation-heading">
      <p className="kiwi-stat-label">Historical local contribution</p>
      <h2 className="mt-1 text-2xl" id="community-participation-heading">
        Community participation
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-base-content/60">
        Verified contributions stay attributed to the community recorded at
        award time, even if your Home Community later changes.
      </p>
      {items.length === 0 ? (
        <div className="kiwi-panel mt-4 p-8 text-center">
          <History aria-hidden="true" className="mx-auto size-8 text-primary" />
          <h3 className="mt-3 text-xl">No community-attributed impact yet</h3>
          <p className="mt-1 text-sm text-base-content/60">
            Future verified impact can appear here when a Home Community is set.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article className="kiwi-panel p-5" key={item.community.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kiwi-stat-label">
                    {item.isCurrentCommunity ? 'Current community' : 'Historical community'}
                  </p>
                  <h3 className="mt-1 text-xl">{item.community.name}</h3>
                </div>
                {item.isCurrentCommunity && (
                  <span className="badge badge-primary">Current</span>
                )}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Stat
                  icon={Flag}
                  label="Verified Quests"
                  value={item.verifiedCompletionCount}
                />
                <Stat icon={Zap} label="Verified XP" value={item.verifiedXp} />
                <Stat
                  icon={History}
                  label="Challenges joined"
                  value={item.challengesContributedTo}
                />
                <Stat
                  icon={Award}
                  label="Challenge awards"
                  value={item.challengeAchievementsEarned}
                />
              </dl>
              <p className="mt-4 text-xs text-base-content/52">
                Latest contribution{' '}
                <time dateTime={item.latestContributionAtUtc}>
                  {new Date(item.latestContributionAtUtc).toLocaleDateString()}
                </time>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flag;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-secondary/65 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-base-content/58">
        <Icon aria-hidden="true" className="size-3.5 text-primary" />
        {label}
      </dt>
      <dd className="mt-1 text-lg font-extrabold">{value}</dd>
    </div>
  );
}

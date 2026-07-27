import { Medal, ShieldCheck, Trophy, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { useAuthQuery } from '../hooks/useAuth.ts';
import {
  useCommunitiesLeaderboard,
  usePeopleLeaderboard,
} from '../hooks/useLeaderboard.ts';
import type {
  CommunitiesLeaderboardPeriod,
  CommunitiesLeaderboardScope,
  CommunityLeaderboardRow,
  LeaderboardRow,
  PeopleLeaderboardPeriod,
  PeopleLeaderboardScope,
} from '../types/leaderboard.ts';
import CommunityChallengesSection from '../components/community/CommunityChallengesSection.tsx';

export default function LeaderboardPage() {
  const auth = useAuthQuery();
  const [mode, setMode] = useState<'people' | 'communities'>('people');
  const [peopleScope, setPeopleScope] =
    useState<PeopleLeaderboardScope>('auckland');
  const [peoplePeriod, setPeoplePeriod] =
    useState<PeopleLeaderboardPeriod>('weekly');
  const [communityScope, setCommunityScope] =
    useState<CommunitiesLeaderboardScope>('auckland');
  const [communityPeriod, setCommunityPeriod] =
    useState<CommunitiesLeaderboardPeriod>('monthly');
  const people = usePeopleLeaderboard(
    peopleScope,
    peoplePeriod,
    mode === 'people',
  );
  const communities = useCommunitiesLeaderboard(
    communityScope,
    communityPeriod,
    mode === 'communities',
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page max-w-5xl">
        <header className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 text-warning">
            <Trophy aria-hidden="true" className="size-7" />
          </span>
          <p className="kiwi-stat-label mt-5">Verified community momentum</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Leaderboard</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-base-content/62">
            Celebrate verified action locally, across Auckland, and throughout
            Aotearoa New Zealand.
          </p>
        </header>

        <section className="kiwi-panel mt-8 p-4 sm:p-5" aria-label="Leaderboard view">
          <div className="tabs tabs-box mx-auto w-fit" role="tablist">
            <button
              className={`tab ${mode === 'people' ? 'tab-active' : ''}`}
              onClick={() => setMode('people')}
              role="tab"
              type="button"
            >
              People
            </button>
            <button
              className={`tab ${mode === 'communities' ? 'tab-active' : ''}`}
              onClick={() => setMode('communities')}
              role="tab"
              type="button"
            >
              Communities
            </button>
          </div>

          {mode === 'people' ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FilterSelect
                label="Scope"
                onChange={(value) => setPeopleScope(value as PeopleLeaderboardScope)}
                value={peopleScope}
              >
                {auth.data && <option value="myCommunity">My Community</option>}
                <option value="auckland">Auckland</option>
                <option value="nz">New Zealand</option>
              </FilterSelect>
              <FilterSelect
                label="Period"
                onChange={(value) => setPeoplePeriod(value as PeopleLeaderboardPeriod)}
                value={peoplePeriod}
              >
                <option value="weekly">This week</option>
                <option value="monthly">This month</option>
                <option value="allTime">All time</option>
              </FilterSelect>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FilterSelect
                label="Scope"
                onChange={(value) => setCommunityScope(value as CommunitiesLeaderboardScope)}
                value={communityScope}
              >
                <option value="auckland">Auckland</option>
                <option value="nz">New Zealand</option>
              </FilterSelect>
              <FilterSelect
                label="Period"
                onChange={(value) => setCommunityPeriod(value as CommunitiesLeaderboardPeriod)}
                value={communityPeriod}
              >
                <option value="monthly">This month</option>
                <option value="allTime">All time</option>
              </FilterSelect>
            </div>
          )}
        </section>

        <section className="mt-8" aria-live="polite">
          {mode === 'people' ? (
            <PeopleStandings query={people} />
          ) : (
            <CommunityStandings query={communities} />
          )}
        </section>

        <CommunityChallengesSection />

        <aside className="mt-8 flex items-start gap-3 rounded-2xl border border-base-300 bg-secondary/55 p-4 text-sm text-base-content/65">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Only verified XP contributes. Communities with fewer than 10
            active contributors use a privacy-protected view.
          </p>
        </aside>
      </main>
    </div>
  );
}

function PeopleStandings({
  query,
}: {
  query: ReturnType<typeof usePeopleLeaderboard>;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (query.data.isPrivacyProtected) {
    return (
      <div className="kiwi-panel p-8 text-center">
        <ShieldCheck className="mx-auto size-9 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-2xl">Community progress is protected</h2>
        <p className="mt-2 text-base-content/60">
          This community is still growing, so member names, ranks, counts, and
          exact progress stay private.
        </p>
      </div>
    );
  }
  if (query.data.rows.length === 0) return <EmptyState label="members" />;
  return (
    <>
      <Podium rows={query.data.rows.slice(0, 3)} />
      <div className="kiwi-panel mt-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Rank</th><th>Member</th><th className="text-right">XP</th><th className="text-right">Quests</th></tr></thead>
          <tbody>
            {query.data.rows.map((row) => (
              <tr key={row.rank}>
                <td><RankMarker rank={row.rank} /></td>
                <td className="font-semibold">{row.displayName}</td>
                <td className="text-right font-bold tabular-nums">{row.totalXp}</td>
                <td className="text-right tabular-nums">{row.verifiedCompletionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CommunityStandings({
  query,
}: {
  query: ReturnType<typeof useCommunitiesLeaderboard>;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (query.data.rows.length === 0) return <EmptyState label="communities" />;
  return (
    <div className="grid gap-4">
      {query.data.rows.map((row: CommunityLeaderboardRow) => (
        <article className="kiwi-panel flex items-center gap-4 p-5" key={row.regionId}>
          <RankMarker rank={row.rank} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl">{row.regionName}</h2>
            <p className="mt-1 text-sm text-base-content/60">
              {row.verifiedCompletionCount} verified completions
            </p>
          </div>
          <div className="text-right text-sm">
            {row.isPrivacyProtected ? (
              <span className="badge badge-outline">Privacy protected</span>
            ) : (
              <>
                <p className="font-bold">{row.completionsPerContributor} / contributor</p>
                <p className="text-base-content/55">{row.activeContributors} contributors</p>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {rows.map((row, index) => (
        <article className="kiwi-panel p-5 text-center" key={row.rank}>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            {index === 0 ? <Trophy className="size-6" /> : <Medal className="size-6" />}
          </span>
          <p className="mt-4 truncate text-xl font-bold">{row.displayName}</p>
          <p className="mt-1 text-sm text-base-content/55">Rank {row.rank}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 font-extrabold">
            <Zap className="size-4 text-warning" /> {row.totalXp} XP
          </p>
        </article>
      ))}
    </div>
  );
}

function RankMarker({ rank }: { rank: number }) {
  return (
    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
      {rank}
    </span>
  );
}

function FilterSelect(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="kiwi-stat-label mb-2 block">{props.label}</span>
      <select
        className="select select-bordered w-full"
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        {props.children}
      </select>
    </label>
  );
}

function LoadingState() {
  return <div className="skeleton h-64 rounded-3xl" aria-label="Loading leaderboard" />;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="kiwi-panel p-8 text-center" role="alert">
      <h2 className="text-2xl">Leaderboard unavailable</h2>
      <button className="btn btn-primary btn-sm mt-4" onClick={onRetry} type="button">Retry</button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="kiwi-panel py-14 text-center">
      <Users className="mx-auto size-9 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-2xl">{`No ranked ${label} yet.`}</h2>
      <p className="mt-2 text-base-content/60">Verified impact will start these standings.</p>
    </div>
  );
}

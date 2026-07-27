import {
  Radio,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
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
import { MedalArtwork } from '../components/game/GameArtwork.tsx';
import { useUiStore } from '../stores/useUiStore.ts';

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
    <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-base-200 py-8">
      <main className="kiwi-page max-w-[56.25rem]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="kiwi-page-heading">Leaderboard</h1>
            <p className="kiwi-page-intro mt-1 max-w-2xl">
              Verified eco quest completions across Kiwimpact.
            </p>
          </div>
          <LiveImpactStatus />
        </header>

        <section className="mt-6" aria-label="Leaderboard view">
          <div className="kiwi-segmented w-fit" role="tablist">
            <button
              aria-selected={mode === 'people'}
              className={mode === 'people' ? 'active' : ''}
              onClick={() => setMode('people')}
              role="tab"
              type="button"
            >
              <Users aria-hidden="true" className="size-4" />
              People
            </button>
            <button
              aria-selected={mode === 'communities'}
              className={mode === 'communities' ? 'active' : ''}
              onClick={() => setMode('communities')}
              role="tab"
              type="button"
            >
              <Trophy aria-hidden="true" className="size-4" />
              Communities
            </button>
          </div>

          {mode === 'people' ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <SegmentedOptions
                label="Scope"
                onChange={(value) => setPeopleScope(value as PeopleLeaderboardScope)}
                options={[
                  ...(auth.data ? [{ label: 'My Community', value: 'myCommunity' }] : []),
                  { label: 'Auckland', value: 'auckland' },
                  { label: 'New Zealand', value: 'nz' },
                ]}
                value={peopleScope}
              />
              <SegmentedOptions
                label="Period"
                onChange={(value) => setPeoplePeriod(value as PeopleLeaderboardPeriod)}
                options={[
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'All time', value: 'allTime' },
                ]}
                value={peoplePeriod}
              />
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <SegmentedOptions
                label="Scope"
                onChange={(value) => setCommunityScope(value as CommunitiesLeaderboardScope)}
                options={[
                  { label: 'Auckland', value: 'auckland' },
                  { label: 'New Zealand', value: 'nz' },
                ]}
                value={communityScope}
              />
              <SegmentedOptions
                label="Period"
                onChange={(value) => setCommunityPeriod(value as CommunitiesLeaderboardPeriod)}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'All time', value: 'allTime' },
                ]}
                value={communityPeriod}
              />
            </div>
          )}
        </section>

        <section className="mt-6" aria-live="polite">
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

function LiveImpactStatus() {
  const status = useUiStore((state) => state.liveImpactStatus);
  const presentation = {
    connecting: {
      Icon: RefreshCw,
      label: 'Connecting to live updates…',
      classes: 'border-info/25 bg-info/8 text-info',
      iconClasses: 'animate-spin',
    },
    live: {
      Icon: Radio,
      label: 'Live verified impact',
      classes: 'border-primary/20 bg-primary/8 text-primary',
      iconClasses: '',
    },
    reconnecting: {
      Icon: RefreshCw,
      label: 'Reconnecting…',
      classes: 'border-warning/30 bg-warning/10 text-warning',
      iconClasses: 'animate-spin',
    },
    unavailable: {
      Icon: WifiOff,
      label: 'Live updates unavailable · REST data shown',
      classes: 'border-base-300 bg-secondary text-base-content/60',
      iconClasses: '',
    },
  }[status];
  const Icon = presentation.Icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${presentation.classes}`}>
      <Icon aria-hidden="true" className={`size-3.5 ${presentation.iconClasses}`} />
      {presentation.label}
    </span>
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
              <tr
                aria-current={row.isCurrentUser ? 'true' : undefined}
                className={row.isCurrentUser ? 'bg-primary/8' : undefined}
                key={row.rank}
              >
                <td><RankMarker rank={row.rank} /></td>
                <td className="font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {row.displayName}
                    {row.isCurrentUser && (
                      <span className="badge badge-primary badge-sm">You</span>
                    )}
                  </span>
                </td>
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
  const displayRows = rows.length === 3 ? [rows[1], rows[0], rows[2]] : rows;
  return (
    <div className="grid items-end gap-4 pt-4 sm:grid-cols-3">
      {displayRows.map((row) => (
        <article
          className={`kiwi-panel relative p-5 text-center ${
            row.rank === 1 ? 'border-accent/60 bg-accent/8 sm:pb-8 sm:pt-7' : ''
          } ${row.isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : ''}`}
          key={row.rank}
        >
          <span className="mx-auto block w-fit">
            <MedalArtwork position={Math.min(row.rank, 3) as 1 | 2 | 3} size={52} />
          </span>
          <p className="mt-4 truncate text-xl font-bold">
            {row.displayName}
            {row.isCurrentUser && (
              <span className="badge badge-primary badge-sm ml-2 align-middle">You</span>
            )}
          </p>
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
  if (rank >= 1 && rank <= 3) {
    return <MedalArtwork position={rank as 1 | 2 | 3} size={30} />;
  }
  return (
    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
      {rank}
    </span>
  );
}

function SegmentedOptions(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <span className="sr-only">{props.label}</span>
      <div aria-label={props.label} className="kiwi-segmented max-w-full overflow-x-auto" role="group">
        {props.options.map((option) => (
          <button
            aria-pressed={props.value === option.value}
            className="whitespace-nowrap"
            key={option.value}
            onClick={() => props.onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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

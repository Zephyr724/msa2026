import {
  Building2,
  Globe2,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users,
  WifiOff,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useMyProfile } from '../hooks/useCommunity.ts';
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
  const profile = useMyProfile(Boolean(auth.data));
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'people' | 'communities'>('people');
  const [peopleScope, setPeopleScope] =
    useState<PeopleLeaderboardScope>(() => {
      const requested = searchParams.get('scope');
      return requested === 'myCommunity' || requested === 'auckland' || requested === 'nz'
        ? requested
        : 'auckland';
    });
  const [peoplePeriod, setPeoplePeriod] =
    useState<PeopleLeaderboardPeriod>(() => {
      const requested = searchParams.get('period');
      return requested === 'weekly' || requested === 'monthly' || requested === 'allTime'
        ? requested
        : 'weekly';
    });
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
  const appliedProfileDefault = useRef(false);

  useEffect(() => {
    if (
      !appliedProfileDefault.current
      && profile.isSuccess
      && searchParams.get('scope') === null
    ) {
      appliedProfileDefault.current = true;
      if (profile.data.homeCommunity) setPeopleScope('myCommunity');
    }
  }, [profile.data, profile.isSuccess, searchParams]);

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
          <div className="kiwi-segmented w-fit rounded-[0.875rem]" role="tablist">
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
              <Globe2 aria-hidden="true" className="size-4" />
              Communities
            </button>
          </div>

          {mode === 'people' ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <SegmentedOptions
                label="Scope"
                onChange={(value) => setPeopleScope(value as PeopleLeaderboardScope)}
                options={[
                  ...(profile.data?.homeCommunity
                    ? [{
                        label: (
                          <span className="flex flex-col items-center leading-tight">
                            <span>{profile.data.homeCommunity.name}</span>
                            <span className="text-[0.62rem] font-medium opacity-60">My Community</span>
                          </span>
                        ),
                        value: 'myCommunity',
                      }]
                    : []),
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
          {mode === 'people' && auth.data && (
            <p className="mt-3 rounded-xl border border-base-300 bg-secondary px-3 py-2 text-center text-xs text-muted-content">
              Viewing a leaderboard does not change your Home Community.{' '}
              <Link className="font-bold text-primary hover:underline" to="/settings/profile">
                Change it in Profile Settings
              </Link>
              .
            </p>
          )}
        </section>

        <section className="mt-6" aria-live="polite">
          {mode === 'people' ? (
            <PeopleStandings query={people} />
          ) : (
            <CommunityStandings query={communities} scope={communityScope} />
          )}
        </section>

        <CommunityChallengesSection />

        <aside className="mt-8 flex items-start gap-3 rounded-2xl border border-base-300 bg-secondary/55 p-4 text-sm text-muted-content">
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
      classes: 'border-base-300 bg-secondary text-muted-content',
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
        <p className="mt-2 text-muted-content">
          This community is still growing, so member names, ranks, counts, and
          exact progress stay private.
        </p>
      </div>
    );
  }
  if (query.data.rows.length === 0) return <EmptyState label="members" />;
  const tableRows = query.data.rows.length > 3
    ? query.data.rows.slice(3)
    : query.data.rows;
  return (
    <>
      <Podium rows={query.data.rows.slice(0, 3)} />
      <div className="kiwi-panel mt-6 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Rank</th><th>Member</th><th className="text-right">XP</th><th className="text-right">Quests</th></tr></thead>
          <tbody>
            {tableRows.map((row) => (
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
  scope,
}: {
  query: ReturnType<typeof useCommunitiesLeaderboard>;
  scope: CommunitiesLeaderboardScope;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (query.data.rows.length === 0) return <EmptyState label="communities" />;
  return (
    <>
      <div className="mb-2">
        <h2 className="text-lg">
          {scope === 'auckland' ? 'Auckland community rankings' : 'New Zealand city rankings'}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-content">
          {scope === 'auckland'
            ? 'Communities within Auckland, ranked by verified quests per active contributor.'
            : 'Cities across New Zealand, ranked by verified quests per active contributor.'}
        </p>
      </div>
      <CommunityPodium rows={query.data.rows.slice(0, 3)} />
      <div className="kiwi-panel mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>{scope === 'auckland' ? 'Community' : 'City'}</th>
              <th className="text-center">Quests</th>
              <th className="text-center">Members</th>
              <th className="text-right">Avg / member</th>
            </tr>
          </thead>
          <tbody>
            {query.data.rows.map((row: CommunityLeaderboardRow) => (
              <tr key={row.regionId}>
                <td><RankMarker rank={row.rank} /></td>
                <td className="font-semibold">{row.regionName}</td>
                <td className="text-center font-bold tabular-nums">
                  {row.verifiedCompletionCount}
                </td>
                <td className="text-center tabular-nums">
                  {row.activeContributors ?? '—'}
                </td>
                <td className="text-right font-bold tabular-nums text-primary">
                  {row.completionsPerContributor ?? 'Protected'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const displayRows = rows.length === 3 ? [rows[1], rows[0], rows[2]] : rows;
  return (
    <div className="flex items-end justify-center gap-3 overflow-x-auto pb-2 pt-5 sm:gap-5">
      {displayRows.map((row) => (
        <PodiumColumn
          avatar={initials(row.displayName)}
          isCurrent={row.isCurrentUser}
          key={row.rank}
          metric={`${row.totalXp.toLocaleString()} XP`}
          name={row.displayName}
          rank={row.rank}
        />
      ))}
    </div>
  );
}

function CommunityPodium({ rows }: { rows: CommunityLeaderboardRow[] }) {
  const displayRows = rows.length === 3 ? [rows[1], rows[0], rows[2]] : rows;
  return (
    <div className="flex items-end justify-center gap-3 overflow-x-auto pb-2 pt-5 sm:gap-5">
      {displayRows.map((row) => (
        <PodiumColumn
          avatar={<Building2 aria-hidden="true" className="size-5" />}
          key={row.regionId}
          metric={`${row.verifiedCompletionCount} verified`}
          name={row.regionName}
          rank={row.rank}
        />
      ))}
    </div>
  );
}

function PodiumColumn({
  avatar,
  isCurrent = false,
  metric,
  name,
  rank,
}: {
  avatar: ReactNode;
  isCurrent?: boolean;
  metric: string;
  name: string;
  rank: number;
}) {
  const height = rank === 1 ? 'h-36' : rank === 2 ? 'h-24' : 'h-20';
  const stageColor = rank === 1
    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
    : rank === 2
      ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700'
      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400';

  return (
    <article
      className={`flex w-28 shrink-0 flex-col items-center gap-2 text-center sm:w-32 ${
        isCurrent ? 'rounded-2xl bg-primary/6 pt-2 ring-2 ring-primary/55' : ''
      }`}
    >
      <MedalArtwork position={rank as 1 | 2 | 3} size={46} />
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 font-bold text-primary">
        {avatar}
      </span>
      <div className="min-h-14 w-full px-1">
        <p className="line-clamp-2 break-words text-xs font-extrabold leading-snug" title={name}>
          {name}
        </p>
        <p className="mt-0.5 truncate text-[0.65rem] text-muted-content">{metric}</p>
      </div>
      <div className={`flex w-24 items-start justify-center rounded-t-[0.75rem] pt-2 sm:w-28 ${height} ${stageColor}`}>
        <span className="kiwi-display text-xl font-bold">{rank}</span>
      </div>
    </article>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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
  options: { label: ReactNode; value: string }[];
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
      <p className="mt-2 text-muted-content">Verified impact will start these standings.</p>
    </div>
  );
}

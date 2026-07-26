import { Medal, ShieldCheck, Trophy, Users, Zap } from 'lucide-react';
import { usePeopleLeaderboard } from '../hooks/useLeaderboard.ts';
import type { LeaderboardRow } from '../types/leaderboard.ts';

export default function LeaderboardPage() {
  const leaderboard = usePeopleLeaderboard();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
      <main className="kiwi-page max-w-5xl">
        <header className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 text-warning">
            <Trophy aria-hidden="true" className="size-7" />
          </span>
          <p className="kiwi-stat-label mt-5">Verified participation</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Leaderboard</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-base-content/62">
            New Zealand members ranked by server-authoritative, verified all-time XP.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <span className="badge badge-primary badge-outline">People</span>
            <span className="badge badge-outline">New Zealand</span>
            <span className="badge badge-outline">All time</span>
          </div>
        </header>

        <section aria-labelledby="people-leaderboard-heading" className="mt-10">
          <h2 className="sr-only" id="people-leaderboard-heading">
            People — New Zealand, all time
          </h2>

          {leaderboard.isPending ? (
            <div aria-live="polite">
              <p className="text-center text-base-content/65">Loading the leaderboard…</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="skeleton h-48 rounded-3xl" key={index} />
                ))}
              </div>
            </div>
          ) : leaderboard.isError ? (
            <div className="kiwi-panel mx-auto max-w-xl p-7 text-center" role="alert">
              <h2 className="text-2xl">The leaderboard is unavailable</h2>
              <p className="mt-2 text-base-content/62">
                We could not load the leaderboard. Please try again.
              </p>
              <button
                className="btn btn-primary btn-sm mt-5"
                onClick={() => void leaderboard.refetch()}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : leaderboard.data.rows.length === 0 ? (
            <div className="kiwi-panel py-14 text-center">
              <Users aria-hidden="true" className="mx-auto size-9 text-primary" />
              <h2 className="mt-4 text-2xl">No ranked members yet.</h2>
              <p className="mt-2 text-base-content/60">
                The first verified completion will start the standings.
              </p>
            </div>
          ) : (
            <>
              <Podium rows={leaderboard.data.rows.slice(0, 3)} />
              <div className="kiwi-panel mt-8 overflow-hidden">
                <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
                  <div>
                    <p className="kiwi-stat-label">Full standings</p>
                    <h2 className="mt-1 text-xl">Top members</h2>
                  </div>
                  <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-fixed w-full">
                    <caption className="sr-only">
                      New Zealand all-time people leaderboard
                    </caption>
                    <colgroup>
                      <col className="w-10 sm:w-14" />
                      <col />
                      <col className="w-16 sm:w-24" />
                      <col className="w-16 sm:w-24" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="px-1 sm:px-3" scope="col">Rank</th>
                        <th className="px-1 sm:px-3" scope="col">Member</th>
                        <th className="px-1 text-right sm:px-3" scope="col">XP</th>
                        <th className="px-1 text-right sm:px-3" scope="col">Quests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.data.rows.map((row) => (
                        <tr className="hover:bg-secondary/45" key={row.rank}>
                          <td className="px-1 py-4 font-semibold sm:px-3">
                            <RankMarker rank={row.rank} />
                          </td>
                          <td className="px-1 py-4 sm:px-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                                {initials(row.displayName)}
                              </span>
                              <span
                                className="min-w-0 truncate font-medium"
                                title={row.displayName}
                              >
                                {row.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="px-1 py-4 text-right font-bold tabular-nums sm:px-3">
                            {row.totalXp}
                          </td>
                          <td className="px-1 py-4 text-right tabular-nums sm:px-3">
                            {row.verifiedCompletionCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="mt-8 flex items-start gap-3 rounded-2xl border border-base-300 bg-secondary/55 p-4 text-sm text-base-content/65">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Only verified XP contributes to these standings. The current Slice
            intentionally keeps one People scope: New Zealand, all time.
          </p>
        </aside>
      </main>
    </div>
  );
}

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {rows.map((row, index) => (
        <article
          aria-label={`Top position ${row.rank}: ${row.displayName}`}
          className={`kiwi-panel relative overflow-hidden p-5 text-center ${
            index === 0 ? 'sm:-translate-y-2 sm:border-accent/50' : ''
          }`}
          key={row.rank}
        >
          <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${
            index === 0 ? 'bg-accent/18 text-warning' : 'bg-primary/10 text-primary'
          }`}>
            {index === 0
              ? <Trophy aria-hidden="true" className="size-6" />
              : <Medal aria-hidden="true" className="size-6" />}
          </span>
          <p className="kiwi-display mt-4 truncate text-xl" title={row.displayName}>
            {row.displayName}
          </p>
          <p className="mt-1 text-sm text-base-content/55">Rank {row.rank}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 font-extrabold">
            <Zap aria-hidden="true" className="size-4 text-warning" />
            {row.totalXp} XP
          </p>
        </article>
      ))}
    </div>
  );
}

function RankMarker({ rank }: { rank: number }) {
  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`grid size-7 place-items-center rounded-full text-xs font-extrabold ${
        rank === 1
          ? 'bg-accent/20 text-warning'
          : rank <= 3
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary text-base-content/60'
      }`}
    >
      {rank}
    </span>
  );
}

function initials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

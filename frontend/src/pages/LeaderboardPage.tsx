import { Trophy } from 'lucide-react';
import { usePeopleLeaderboard } from '../hooks/useLeaderboard.ts';

export default function LeaderboardPage() {
  const leaderboard = usePeopleLeaderboard();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Trophy aria-hidden="true" className="size-8 text-warning" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <p className="mt-2 text-base-content/70">
          New Zealand members ranked by verified all-time impact.
        </p>
      </header>

      <section aria-labelledby="people-leaderboard-heading">
        <h2 className="text-xl font-semibold" id="people-leaderboard-heading">
          People — New Zealand, all time
        </h2>

        {leaderboard.isPending ? (
          <p aria-live="polite" className="mt-4 text-base-content/70">
            Loading the leaderboard…
          </p>
        ) : leaderboard.isError ? (
          <div className="mt-4 rounded-box bg-error/10 p-4" role="alert">
            <p>We could not load the leaderboard. Please try again.</p>
            <button
              className="btn btn-error btn-sm mt-3"
              onClick={() => void leaderboard.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.data.rows.length === 0 ? (
          <p className="mt-4 rounded-box bg-base-100 p-4 text-base-content/70">
            No ranked members yet.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-box border border-base-300 bg-base-100">
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
                  <th className="px-1 sm:px-3" scope="col">
                    Rank
                  </th>
                  <th className="px-1 sm:px-3" scope="col">
                    Member
                  </th>
                  <th className="px-1 text-right sm:px-3" scope="col">
                    XP
                  </th>
                  <th className="px-1 text-right sm:px-3" scope="col">
                    Quests
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.data.rows.map((row) => (
                  <tr key={row.rank}>
                    <td className="px-1 py-3 font-semibold sm:px-3">
                      <span aria-label={`Rank ${row.rank}`}>{row.rank}</span>
                    </td>
                    <td
                      className="min-w-0 truncate px-1 py-3 font-medium sm:px-3"
                      title={row.displayName}
                    >
                      {row.displayName}
                    </td>
                    <td className="px-1 py-3 text-right tabular-nums sm:px-3">
                      {row.totalXp}
                    </td>
                    <td className="px-1 py-3 text-right tabular-nums sm:px-3">
                      {row.verifiedCompletionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

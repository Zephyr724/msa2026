import { Flag, LockKeyhole, Target } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuthQuery } from '../../hooks/useAuth';
import {
  useCommunityChallengeMutations,
  useCommunityChallenges,
} from '../../hooks/useCommunity';
import { useRegions } from '../../hooks/useRegions';
import { ApiError } from '../../lib/api/apiFetch';
import type { CommunityChallenge } from '../../types/community';
import { useAchievementCatalog } from '../../hooks/useAchievements.ts';

export default function CommunityChallengesSection({
  showAdminControls = true,
}: {
  showAdminControls?: boolean;
}) {
  const challenges = useCommunityChallenges();
  const auth = useAuthQuery();
  const isAdmin = auth.data?.roles?.includes('Admin') ?? false;

  return (
    <section className="mt-12" aria-labelledby="community-challenges-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kiwi-stat-label">Act together</p>
          <h2 className="mt-1 text-3xl" id="community-challenges-heading">
            Community challenges
          </h2>
        </div>
        <span className="badge badge-primary badge-outline">Verified progress only</span>
      </div>

      {challenges.isPending && <div className="skeleton mt-5 h-48 rounded-3xl" />}
      {challenges.isError && (
        <div className="alert alert-error mt-5">
          <span>Community challenges could not be loaded.</span>
          <button className="btn btn-sm" onClick={() => void challenges.refetch()} type="button">
            Retry
          </button>
        </div>
      )}
      {challenges.data?.length === 0 && (
        <div className="kiwi-panel mt-5 p-8 text-center">
          <Flag className="mx-auto size-8 text-primary" aria-hidden="true" />
          <h3 className="mt-3 text-xl">No community challenge is published yet</h3>
        </div>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {challenges.data?.map((challenge) => (
          <ChallengeCard challenge={challenge} key={challenge.id} />
        ))}
      </div>
      {showAdminControls && isAdmin && (
        <ChallengeAdminPanel challenges={challenges.data ?? []} />
      )}
    </section>
  );
}

function ChallengeCard({ challenge }: { challenge: CommunityChallenge }) {
  return (
    <article className="kiwi-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kiwi-stat-label">{challenge.localArea.name}</p>
          <h3 className="mt-1 text-xl">
            {challenge.targetValue} verified actions
          </h3>
        </div>
        <span className={`badge ${
          challenge.status === 'Completed'
            ? 'badge-success'
            : challenge.status === 'Active'
              ? 'badge-primary'
              : 'badge-ghost'
        }`}>{challenge.status}</span>
      </div>
      <progress
        aria-label={`${challenge.progressPercentage}% complete`}
        className="progress progress-primary mt-5 w-full"
        max="100"
        value={challenge.progressPercentage}
      />
      <div className="mt-2 flex justify-between text-sm">
        <span className="font-bold">{challenge.currentProgress} complete</span>
        <span>{challenge.progressPercentage}%</span>
      </div>
      <p className="mt-3 text-sm text-muted-content">
        {new Date(challenge.periodStartUtc).toLocaleDateString()} –{' '}
        {new Date(challenge.periodEndUtc).toLocaleDateString()}
      </p>
      {challenge.isPrivacyProtected ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-content">
          <LockKeyhole className="size-4" aria-hidden="true" />
          Contributor count is protected while this community grows.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-content">
          {challenge.activeContributors} active contributors
        </p>
      )}
    </article>
  );
}

function ChallengeAdminPanel({ challenges }: { challenges: CommunityChallenge[] }) {
  const regions = useRegions();
  const achievementCatalog = useAchievementCatalog();
  const mutations = useCommunityChallengeMutations();
  const [editing, setEditing] = useState<CommunityChallenge | null>(null);
  const [regionId, setRegionId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [target, setTarget] = useState('25');
  const [rewardAchievementId, setRewardAchievementId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function beginEdit(challenge: CommunityChallenge) {
    setEditing(challenge);
    setRegionId(challenge.localArea.id);
    setStart(toLocalInput(challenge.periodStartUtc));
    setEnd(toLocalInput(challenge.periodEndUtc));
    setTarget(String(challenge.targetValue));
    setRewardAchievementId(challenge.rewardAchievementId ?? '');
    setMessage(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const input = {
      // datetime-local has no zone. The Date conversion interprets the
      // organizer's local value and serializes an unambiguous UTC instant.
      localAreaRegionId: regionId,
      periodStartUtc: new Date(start).toISOString(),
      periodEndUtc: new Date(end).toISOString(),
      targetValue: Number(target),
      rewardAchievementId: rewardAchievementId || null,
      version: editing?.version,
    };
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, input });
      else await mutations.create.mutateAsync(input);
      setMessage(editing ? 'Challenge updated.' : 'Challenge created.');
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof ApiError
        ? error.problem?.detail ?? 'Challenge could not be saved.'
        : 'Challenge could not be saved.');
    }
  }

  return (
    <section className="kiwi-panel mt-6 p-5" aria-labelledby="challenge-admin-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kiwi-stat-label">Admin controls</p>
          <h3 className="mt-1 text-2xl" id="challenge-admin-heading">
            {editing ? 'Edit planned challenge' : 'Create challenge'}
          </h3>
        </div>
        {editing && (
          <button className="btn btn-error btn-sm" onClick={() => setEditing(null)} type="button">
            Cancel edit
          </button>
        )}
      </div>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <label>
          <span className="label-text">Local Area</span>
          <select className="select select-bordered mt-1 w-full" onChange={(event) => setRegionId(event.target.value)} required value={regionId}>
            <option value="">Choose a community</option>
            {regions.data?.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label-text">Target</span>
          <input className="input input-bordered mt-1 w-full" min="1" onChange={(event) => setTarget(event.target.value)} required type="number" value={target} />
        </label>
        <label>
          <span className="label-text">Starts</span>
          <input className="input input-bordered mt-1 w-full" onChange={(event) => setStart(event.target.value)} required type="datetime-local" value={start} />
        </label>
        <label>
          <span className="label-text">Ends</span>
          <input className="input input-bordered mt-1 w-full" onChange={(event) => setEnd(event.target.value)} required type="datetime-local" value={end} />
        </label>
        <label className="sm:col-span-2">
          <span className="label-text">Community achievement reward</span>
          <select
            className="select select-bordered mt-1 w-full"
            onChange={(event) => setRewardAchievementId(event.target.value)}
            value={rewardAchievementId}
          >
            <option value="">No achievement reward</option>
            {achievementCatalog.data
              ?.filter((achievement) => achievement.category === 'Community')
              .map((achievement) => (
                <option key={achievement.id} value={achievement.id}>
                  {achievement.name}
                </option>
              ))}
          </select>
          <span className="mt-1 block text-xs text-muted-content">
            Every verified contributor receives this reward if the challenge
            completes. Competitive terms lock once it starts.
          </span>
        </label>
        <button className="btn btn-primary sm:col-span-2" disabled={mutations.create.isPending || mutations.update.isPending} type="submit">
          <Target className="size-4" /> {editing ? 'Save challenge' : 'Create challenge'}
        </button>
      </form>
      {message && <p className="mt-3 text-sm" role="status">{message}</p>}
      {challenges.some((item) => item.status === 'Active') && (
        <div className="mt-5 border-t border-base-300 pt-4">
          <p className="font-bold">Active challenge controls</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {challenges.filter((item) => item.status === 'Active').map((challenge) => (
              <div className="join" key={challenge.id}>
                <button className="btn btn-sm join-item" onClick={() => beginEdit(challenge)} type="button">Edit {challenge.localArea.name}</button>
                <button
                  className="btn btn-error btn-outline btn-sm join-item"
                  onClick={() => void mutations.cancel.mutateAsync({ id: challenge.id, version: challenge.version })}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function toLocalInput(value: string) {
  const date = new Date(value);
  // Offset the UTC value before slicing because datetime-local expects a
  // zone-less wall-clock string rather than an ISO `Z` timestamp.
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

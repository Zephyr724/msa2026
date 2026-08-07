import { Flag, LockKeyhole, Target } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../../hooks/useAuth';
import {
  useCommunityChallengeMutations,
  useCommunityChallenges,
  useMyProfile,
} from '../../hooks/useCommunity';
import { useCities, useRegions } from '../../hooks/useRegions';
import { ApiError } from '../../lib/api/apiFetch';
import type { CommunityChallenge } from '../../types/community';
import { useAchievementCatalog } from '../../hooks/useAchievements.ts';

export default function CommunityChallengesSection({
  showAdminControls = true,
}: {
  showAdminControls?: boolean;
}) {
  const auth = useAuthQuery();
  const isAdmin = auth.data?.roles?.includes('Admin') ?? false;
  const profile = useMyProfile(Boolean(auth.data));
  const regions = useRegions();
  const cities = useCities();
  const achievementCatalog = useAchievementCatalog();
  const rewardNames = new Map(
    achievementCatalog.data?.map((achievement) => [achievement.id, achievement.name]) ?? [],
  );

  const signedIn = Boolean(auth.data);
  const profileFailed = signedIn && profile.isError;
  const homeCommunity = profile.data?.homeCommunity ?? null;
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [view, setView] = useState<'current' | 'past'>('current');

  // Truthful launch boundary: only LocalAreas under the Auckland
  // AdministrativeArea are browseable. The selector stays empty until the
  // boundary is known so non-Auckland communities never leak into it.
  const aucklandId = cities.data?.find((city) => city.name === 'Auckland')?.id;
  const aucklandAreas = aucklandId
    ? (regions.data ?? []).filter((region) => region.parentRegionId === aucklandId)
    : [];
  // A member's verified actions genuinely attribute to their chosen home
  // community even when it sits outside the launch boundary, so it stays
  // selectable — clearly labeled — rather than being silently hidden.
  const homeOutsideBoundary = Boolean(
    homeCommunity && aucklandId && !aucklandAreas.some((area) => area.id === homeCommunity.id),
  );
  const regionOptions = [...aucklandAreas];
  if (homeCommunity && !regionOptions.some((region) => region.id === homeCommunity.id)) {
    regionOptions.unshift(homeCommunity);
  }

  // Default the view to the member's home community; guests and members
  // without one browse the first Auckland community. A failed profile query
  // never falls back silently — it surfaces a bounded retry state instead.
  const regionId = selectedRegionId
    ?? homeCommunity?.id
    ?? (profileFailed ? undefined : aucklandAreas[0]?.id);
  // The API accepts a single status value, so "Past" requests the community's
  // full history and filters out the Active entry client-side.
  const challenges = useCommunityChallenges(
    { regionId, status: view === 'current' ? 'Active' : undefined },
    { enabled: Boolean(regionId) },
  );

  const regionName = regionOptions.find((region) => region.id === regionId)?.name
    ?? homeCommunity?.name
    ?? '';
  const isHomeSelection = Boolean(homeCommunity) && regionId === homeCommunity?.id;

  const visibleChallenges = view === 'current'
    ? challenges.data ?? []
    : [...(challenges.data ?? [])]
        .filter((challenge) => challenge.status !== 'Active')
        .sort((left, right) =>
          Date.parse(right.periodStartUtc) - Date.parse(left.periodStartUtc));

  const areaLabel = view === 'past'
    ? `Past results · ${regionName}`
    : isHomeSelection
      ? `Your community · ${regionName}`
      : `Current challenge · ${regionName}`;

  return (
    <section className="mt-12" aria-labelledby="community-challenges-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kiwi-stat-label">Act together</p>
          <h2 className="mt-1 text-3xl" id="community-challenges-heading">
            Community challenges
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-outline">Auckland-first launch</span>
          <span className="badge badge-primary badge-outline">Verified progress only</span>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-content">
        Each local-board community shares one collective goal every month.
        Members contribute automatically through verified quest completions
        attributed to their chosen home community — when the community reaches
        its target before the month ends, every contributor earns the listed
        reward achievement. Coverage currently spans Auckland local boards
        while Kiwimpact launches.
      </p>

      {signedIn && profileFailed && (
        <div className="alert alert-error mt-5" role="alert">
          <span>
            Your profile could not be loaded, so your home community is unknown.
            You can still browse Auckland communities below.
          </span>
          <button className="btn btn-sm" onClick={() => void profile.refetch()} type="button">
            Retry
          </button>
        </div>
      )}

      {signedIn && profile.data && !homeCommunity && (
        <div className="kiwi-panel mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="kiwi-stat-label">Your community</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-content">
              You have not chosen a home community yet. Pick one to join its
              monthly challenge — your verified quests then count towards it
              automatically.
            </p>
          </div>
          <Link className="btn btn-primary btn-sm" to="/settings/profile">
            Choose your home community
          </Link>
        </div>
      )}

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="min-w-0">
          <span className="label-text">Community</span>
          <select
            className="select select-bordered mt-1 w-full min-w-0 max-w-full"
            onChange={(event) => setSelectedRegionId(event.target.value)}
            value={regionId ?? ''}
          >
            {regionOptions.length === 0 && <option value="">Loading communities…</option>}
            {!regionId && regionOptions.length > 0 && (
              <option value="">Select a community…</option>
            )}
            {regionOptions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
                {homeOutsideBoundary && region.id === homeCommunity?.id
                  ? ' (your home)'
                  : ''}
              </option>
            ))}
          </select>
        </label>
        <div
          aria-label="Challenge period"
          className="join w-fit max-w-full justify-self-start sm:justify-self-end"
          role="group"
        >
          <button
            aria-pressed={view === 'current'}
            className={`btn btn-sm join-item ${view === 'current' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('current')}
            type="button"
          >
            Current
          </button>
          <button
            aria-pressed={view === 'past'}
            className={`btn btn-sm join-item ${view === 'past' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('past')}
            type="button"
          >
            Past results
          </button>
        </div>
      </div>

      {homeOutsideBoundary && isHomeSelection && (
        <p className="mt-2 text-xs text-muted-content">
          {homeCommunity?.name} sits outside the Auckland launch coverage. It is
          shown because it is your home community — your verified actions still
          count towards it.
        </p>
      )}

      {!regionId && (regions.isPending || cities.isPending || (signedIn && profile.isPending)) && (
        <div className="skeleton mt-5 h-48 rounded-3xl" />
      )}
      {!regionId
        && !regions.isPending
        && !cities.isPending
        && !profile.isPending
        && !profileFailed
        && (
        <div className="alert alert-error mt-5">
          <span>Communities could not be loaded.</span>
          <button
            className="btn btn-sm"
            onClick={() => {
              void regions.refetch();
              void cities.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
      {regionId && challenges.isPending && <div className="skeleton mt-5 h-48 rounded-3xl" />}
      {regionId && challenges.isError && (
        <div className="alert alert-error mt-5">
          <span>Community challenges could not be loaded.</span>
          <button className="btn btn-sm" onClick={() => void challenges.refetch()} type="button">
            Retry
          </button>
        </div>
      )}
      {challenges.isSuccess && (
        <p className="kiwi-stat-label mt-5">{areaLabel}</p>
      )}
      {challenges.isSuccess && visibleChallenges.length === 0 && (
        <div className="kiwi-panel mt-2 p-8 text-center">
          <Flag className="mx-auto size-8 text-primary" aria-hidden="true" />
          <h3 className="mt-3 text-xl">
            {view === 'past'
              ? `No past challenges recorded for ${regionName} yet`
              : isHomeSelection
                ? `${regionName} has no active challenge this month`
                : `No active challenge this month for ${regionName}`}
          </h3>
          {view === 'current' && (
            <p className="mt-2 text-sm text-muted-content">
              The next monthly challenge appears here when it begins.
            </p>
          )}
        </div>
      )}
      {visibleChallenges.length > 0 && (
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          {visibleChallenges.map((challenge) => (
            <ChallengeCard
              challenge={challenge}
              isPast={view === 'past'}
              key={challenge.id}
              rewardName={challenge.rewardAchievementId
                ? rewardNames.get(challenge.rewardAchievementId) ?? null
                : null}
            />
          ))}
        </div>
      )}
      {showAdminControls && isAdmin && <ChallengeAdminPanel />}
    </section>
  );
}

function ChallengeCard({
  challenge,
  isPast = false,
  rewardName = null,
}: {
  challenge: CommunityChallenge;
  isPast?: boolean;
  rewardName?: string | null;
}) {
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
      {challenge.rewardAchievementId
        // Degrade gracefully: an unresolved catalog entry hides the reward
        // line entirely rather than inventing a reward.
        ? rewardName && (
            <p className="mt-3 text-sm font-semibold text-primary">
              Reward: {rewardName} achievement
            </p>
          )
        : !isPast && (
            <p className="mt-3 text-sm text-muted-content">
              No bonus reward this month
            </p>
          )}
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

function ChallengeAdminPanel() {
  const challenges = useCommunityChallenges();
  const allChallenges = challenges.data ?? [];
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
      {allChallenges.some((item) => item.status === 'Active') && (
        <div className="mt-5 border-t border-base-300 pt-4">
          <p className="font-bold">Active challenge controls</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allChallenges.filter((item) => item.status === 'Active').map((challenge) => (
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

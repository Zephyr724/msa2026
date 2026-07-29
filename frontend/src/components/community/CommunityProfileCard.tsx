import { MapPin, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMyProfile, useUpdateMyProfile } from '../../hooks/useCommunity';
import { useRegions } from '../../hooks/useRegions';
import { ApiError } from '../../lib/api/apiFetch';

export default function CommunityProfileCard() {
  const profile = useMyProfile();
  const regions = useRegions();
  const update = useUpdateMyProfile();
  const [regionId, setRegionId] = useState('');
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      setRegionId(profile.data.homeCommunity?.id ?? '');
      setShow(profile.data.showCommunityOnPassport);
    }
  }, [profile.data]);

  if (profile.isPending) return <div className="skeleton mt-6 h-40 rounded-3xl" />;
  if (profile.isError) return null;
  const changeDate = profile.data.communityChangeAvailableAtUtc
    ? new Date(profile.data.communityChangeAvailableAtUtc)
    : null;
  const cooldown = changeDate !== null && changeDate > new Date();
  const selectionChanged = regionId !== (profile.data.homeCommunity?.id ?? '');

  async function save() {
    setMessage(null);
    try {
      await update.mutateAsync({
        homeCommunityRegionId: regionId || null,
        showCommunityOnPassport: show,
      });
      setMessage('Community preferences saved.');
    } catch (error) {
      setMessage(error instanceof ApiError
        ? error.problem?.detail ?? 'Community preferences could not be saved.'
        : 'Community preferences could not be saved.');
    }
  }

  return (
    <section className="kiwi-panel mt-6 p-5" aria-labelledby="home-community-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="kiwi-stat-label">Local identity</p>
          <h2 className="mt-1 text-2xl" id="home-community-heading">Home Community</h2>
          <p className="mt-1 text-sm text-muted-content">
            Choose a coarse Local Area. Precise home location is never requested.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        <select
          aria-label="Home Community"
          className="select select-bordered w-full"
          onChange={(event) => setRegionId(event.target.value)}
          value={regionId}
        >
          <option value="">No Home Community</option>
          {regions.data?.map((region) => (
            <option key={region.id} value={region.id}>{region.name}</option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          disabled={update.isPending || (cooldown && selectionChanged)}
          onClick={() => void save()}
          type="button"
        >
          <Save className="size-4" /> Save
        </button>
      </div>
      <label className="label mt-3 cursor-pointer justify-start gap-3">
        <input
          checked={show}
          className="toggle toggle-primary"
          disabled={!regionId}
          onChange={(event) => setShow(event.target.checked)}
          type="checkbox"
        />
        <span>Show my community on my private Passport</span>
      </label>
      {cooldown && (
        <p className="mt-2 text-sm text-warning">
          A different community can be selected after {changeDate.toLocaleDateString()}.
        </p>
      )}
      {message && <p className="mt-2 text-sm" role="status">{message}</p>}
    </section>
  );
}

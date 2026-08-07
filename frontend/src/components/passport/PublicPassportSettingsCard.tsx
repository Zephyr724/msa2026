import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Globe2, LockKeyhole } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMyAchievements } from '../../hooks/useAchievements.ts';
import {
  usePublicPassportSettings,
  useUpdatePublicPassportSettings,
} from '../../hooks/usePublicPassport.ts';

export default function PublicPassportSettingsCard() {
  const settings = usePublicPassportSettings();
  const earned = useMyAchievements();
  const update = useUpdatePublicPassportSettings();
  const [enabled, setEnabled] = useState(false);
  const [featured, setFeatured] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.isEnabled);
    setFeatured(settings.data.featuredAchievementIds);
  }, [settings.data]);

  const earnedById = useMemo(
    () => new Map((earned.data ?? []).map((item) => [item.achievementId, item])),
    [earned.data],
  );
  const earnedOptions = [...earnedById.values()];
  const shareUrl = settings.data?.shareId
    ? `${window.location.origin}/p/${settings.data.shareId}`
    : null;

  function toggleAchievement(id: string) {
    setFeatured((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 5 ? [...current, id] : current);
  }

  function move(id: string, delta: -1 | 1) {
    setFeatured((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + delta;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  if (settings.isPending || earned.isPending) {
    return <div aria-label="Loading public Passport settings" className="skeleton mt-6 h-52 w-full" />;
  }
  if (settings.isError || earned.isError) {
    return (
      <div className="alert alert-error mt-6" role="alert">
        <span>Public Passport settings could not be loaded.</span>
        <button className="btn btn-ghost btn-sm" onClick={() => void settings.refetch()} type="button">Retry</button>
      </div>
    );
  }

  return (
    <div className="kiwi-panel mt-6 overflow-hidden">
      <div className="border-b border-base-300 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-content shadow-sm">
              {enabled ? <Globe2 aria-hidden="true" className="size-5" /> : <LockKeyhole aria-hidden="true" className="size-5" />}
            </span>
            <div>
              <p className="kiwi-stat-label">Opt-in showcase</p>
              <h3 className="mt-1 text-xl">Public Impact Passport</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-content">
                Share verified impact, your trophy and up to five chosen achievements. Your Home Community and completion history stay private.
              </p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm font-bold">
            <span>{enabled ? 'Public' : 'Private'}</span>
            <input
              checked={enabled}
              className="toggle toggle-primary"
              onChange={(event) => setEnabled(event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold">Featured achievements</p>
            <p className="text-xs text-muted-content">Choose and order up to five. {featured.length}/5 selected.</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-2">
          {earnedOptions.map((achievement) => {
            const index = featured.indexOf(achievement.achievementId);
            const selected = index >= 0;
            return (
              <li className={`flex items-center gap-3 rounded-2xl border p-3 ${selected ? 'border-primary/45 bg-primary/5' : 'border-base-300'}`} key={achievement.achievementId}>
                <button
                  aria-pressed={selected}
                  className={`grid size-7 shrink-0 place-items-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-content' : 'border-base-300'}`}
                  onClick={() => toggleAchievement(achievement.achievementId)}
                  type="button"
                >
                  {selected && <Check aria-hidden="true" className="size-4" />}
                  <span className="sr-only">{selected ? 'Remove' : 'Feature'} {achievement.name}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{achievement.name}</p>
                  <p className="truncate text-xs text-muted-content">{achievement.description}</p>
                </div>
                {selected && (
                  <div className="flex gap-1">
                    <button aria-label={`Move ${achievement.name} up`} className="btn btn-ghost btn-xs btn-square" disabled={index === 0} onClick={() => move(achievement.achievementId, -1)} type="button"><ChevronUp className="size-4" /></button>
                    <button aria-label={`Move ${achievement.name} down`} className="btn btn-ghost btn-xs btn-square" disabled={index === featured.length - 1} onClick={() => move(achievement.achievementId, 1)} type="button"><ChevronDown className="size-4" /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {earnedById.size === 0 && <p className="mt-4 text-sm text-muted-content">Earn an achievement to feature it here.</p>}
        {featured.length === 5 && (
          <p className="mt-3 text-xs font-semibold text-primary">Five selected. Remove one before choosing another.</p>
        )}

        {shareUrl && (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-base-200 p-3">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-content">{shareUrl}</p>
            <button className="btn btn-ghost btn-sm" disabled={!settings.data?.isEnabled} onClick={() => void copyLink()} type="button">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            {settings.data?.isEnabled && (
              <a className="btn btn-ghost btn-sm" href={shareUrl} rel="noreferrer" target="_blank">
                Preview <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
        {!settings.data?.isEnabled && settings.data?.shareId && (
          <p className="mt-2 text-xs text-muted-content">Your private link is reserved and will work again if you re-enable sharing.</p>
        )}
        {update.isError && <p className="mt-4 text-sm font-semibold text-error" role="alert">Settings were not saved. Check your selections and try again.</p>}
        <div className="mt-5 flex justify-end">
          <button
            className="btn btn-primary rounded-full px-6"
            disabled={update.isPending}
            onClick={() => update.mutate({ isEnabled: enabled, featuredAchievementIds: featured })}
            type="button"
          >
            {update.isPending ? 'Saving…' : 'Save public Passport'}
          </button>
        </div>
      </div>
    </div>
  );
}

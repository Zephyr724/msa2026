import {
  ArrowLeft,
  CheckCircle2,
  Download,
  IdCard,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AchievementBadgeArt,
  TrophyArtwork,
} from '../components/game/GameArtwork.tsx';
import { useAuthQuery } from '../hooks/useAuth.ts';
import {
  useMyAchievementProfile,
  useMyAchievements,
} from '../hooks/useAchievements.ts';
import { useAllPassportCompletions } from '../hooks/usePassportCompletions.ts';
import { useProgression } from '../hooks/useProgression.ts';
import {
  achievementBadgeSvgString,
  trophySvgString,
} from '../lib/gameArtworkSvg.ts';
import {
  drawShareCard,
  isCurrentArtwork,
  SHARE_CARD_MAX_BADGES,
  SHARE_CARD_OVERLAYS,
  SHARE_CARD_THEMES,
  type ShareCardOverlay,
  type ShareCardTheme,
} from '../lib/shareCard.ts';
import { loadSvgImage } from '../lib/svgImageLoader.ts';
import type {
  AchievementRarity,
  AchievementTrophyTier,
} from '../types/achievement.ts';
import type { PassportCompletionItem } from '../types/passport.ts';

const THEME_LABELS: Record<ShareCardTheme, string> = {
  forest: 'Forest',
  ocean: 'Ocean',
  sunrise: 'Sunrise',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  Unawarded: 'Unawarded',
  UltraRare: 'Ultra rare',
  Rare: 'Rare',
  Uncommon: 'Uncommon',
  Common: 'Common',
};

interface BadgeSpec {
  code: string;
  label: string;
}

interface CardArtwork {
  completionId: string;
  tier: AchievementTrophyTier | undefined;
  badgeKeys: string[];
  trophyImage: HTMLImageElement | null;
  badgeImages: (HTMLImageElement | null)[];
}

export default function ShareCardBuilderPage() {
  const auth = useAuthQuery();
  const progression = useProgression();
  const history = useAllPassportCompletions();
  const achievementProfile = useMyAchievementProfile();
  const myAchievements = useMyAchievements();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(
    () => searchParams.get('completionId') ?? '',
  );
  const [theme, setTheme] = useState<ShareCardTheme>('forest');
  const [overlay, setOverlay] = useState<ShareCardOverlay>('dark');
  // Names are opt-in because the generated PNG may be shared outside the app.
  const [showName, setShowName] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<CardArtwork | null>(null);

  const verified = useMemo(
    () => history.data?.filter((item) => item.status === 'Verified') ?? [],
    [history.data],
  );
  const selected = verified.find((item) => item.completionId === selectedId)
    ?? verified[0];

  // Completion records carry achievement names only; joining them to the
  // earned-achievement catalog by name yields the codes that key the artwork.
  const earnedByName = useMemo(
    () => new Map(
      (myAchievements.data ?? []).map((earned) => [earned.name, earned]),
    ),
    [myAchievements.data],
  );

  function badgeSpecsFor(item: PassportCompletionItem): BadgeSpec[] {
    return (item.achievementNames ?? []).map((name) => ({
      // Unmatched names still render a generic badge keyed off the name.
      code: earnedByName.get(name)?.code ?? name,
      label: name,
    }));
  }

  const selectedBadges = useMemo(
    () => (selected
      ? (selected.achievementNames ?? []).map((name) => ({
        code: earnedByName.get(name)?.code ?? name,
        label: name,
      })).slice(0, SHARE_CARD_MAX_BADGES)
      : []),
    [selected, earnedByName],
  );

  const trophyTier = achievementProfile.data?.trophy.tier;

  // Stable identity of the current badge set. Re-resolution of names to
  // codes (when the earned-achievement query lands) changes these keys even
  // when the count is unchanged, which must invalidate earlier artwork.
  const selectedBadgeKeys = useMemo(
    () => selectedBadges.map((badge) => `${badge.code}|${badge.label}`),
    [selectedBadges],
  );

  useEffect(() => {
    // A stale or manually edited completionId falls back to the newest
    // verified item rather than leaving the canvas with no selection.
    if (
      verified[0]
      && !verified.some((item) => item.completionId === selectedId)
    ) {
      setSelectedId(verified[0].completionId);
    }
  }, [selectedId, verified]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const trophyPromise = trophyTier
      ? loadSvgImage(trophySvgString(trophyTier, 160))
      : Promise.resolve(null);
    const badgePromises = selectedBadges.map((badge) =>
      loadSvgImage(achievementBadgeSvgString({
        code: badge.code,
        label: badge.label,
        unlocked: true,
        size: 96,
      })));
    void Promise.all([trophyPromise, ...badgePromises]).then(
      ([trophyImage, ...badgeImages]) => {
        if (!cancelled) {
          setArtwork({
            completionId: selected.completionId,
            tier: trophyTier,
            badgeKeys: selectedBadgeKeys,
            trophyImage,
            badgeImages,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [selected, selectedBadges, selectedBadgeKeys, trophyTier]);

  // Artwork is accepted only when it matches the current selection, tier,
  // and badge identity, so a stale async load can never draw into — or be
  // exported as — a newly resolved card.
  const activeArtwork = artwork
    && selected
    && isCurrentArtwork(artwork, selected.completionId, trophyTier, selectedBadgeKeys)
    ? artwork
    : null;
  const artworkPending = Boolean(
    selected
    && (trophyTier || selectedBadges.length > 0)
    && !activeArtwork,
  );

  // Share/Download stay disabled until the achievement profile, the
  // earned-achievement resolution, and the current card's artwork have all
  // settled — an export must never miss the requested trophy or carry stale
  // badges. Query or decode failures are exportable: they draw truthful
  // fallbacks instead.
  const exportReady = Boolean(selected)
    && !achievementProfile.isPending
    && !myAchievements.isPending
    && !artworkPending;

  useEffect(() => {
    if (!canvasRef.current || !selected || !progression.data || !auth.data) return;
    drawShareCard(canvasRef.current, {
      completion: selected,
      displayName: auth.data.displayName,
      overlay,
      progression: progression.data,
      showName,
      theme,
      trophy: trophyTier
        ? { tier: trophyTier, image: activeArtwork?.trophyImage ?? null }
        : undefined,
      achievementBadges: selectedBadges.map((badge, index) => ({
        label: badge.label,
        image: activeArtwork?.badgeImages[index] ?? null,
      })),
    });
  }, [
    activeArtwork,
    auth.data,
    overlay,
    progression.data,
    selected,
    selectedBadges,
    showName,
    theme,
    trophyTier,
  ]);

  function createBlob(): Promise<Blob | null> {
    // Canvas encoding is callback-based; wrapping it keeps download and Web
    // Share paths on the same asynchronous failure boundary.
    return new Promise((resolve) => {
      canvasRef.current?.toBlob(resolve, 'image/png');
    });
  }

  async function download() {
    setMessage(null);
    const blob = await createBlob();
    if (!blob) {
      setMessage('The image could not be prepared. Please try again.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'kiwimpact-share-card.png';
    link.href = url;
    link.click();
    // The object URL is needed only long enough to initiate the browser save.
    URL.revokeObjectURL(url);
    setMessage('Share Card downloaded.');
  }

  async function share() {
    setMessage(null);
    const blob = await createBlob();
    if (!blob) {
      setMessage('The image could not be prepared. Please try again.');
      return;
    }
    const file = new File([blob], 'kiwimpact-share-card.png', { type: 'image/png' });
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) {
      setMessage('Sharing is not available in this browser. Download the PNG instead.');
      return;
    }
    try {
      await navigator.share({
        files: [file],
        text: 'A verified local action from my Kiwimpact Passport.',
        title: 'My Kiwimpact Share Card',
      });
      setMessage('Share Card ready to share.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Sharing was not completed. You can download the PNG instead.');
    }
  }

  const loading = history.isPending || progression.isPending;
  const failed = history.isError || progression.isError;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-base-200 py-8">
      <main className="kiwi-page">
        <Link className="btn btn-ghost btn-sm -ml-3 mb-5" to="/passport">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Passport
        </Link>
        <header>
          <p className="kiwi-stat-label">Privacy-safe sharing</p>
          <h1 className="mt-1 kiwi-page-heading">Share Card Builder</h1>
          <p className="kiwi-page-intro mt-1 max-w-2xl">
            Turn one of your verified completions into a personal achievement card.
          </p>
        </header>

        {loading && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[21rem_minmax(0,1fr)]" aria-live="polite">
            <div className="skeleton h-[34rem] rounded-3xl" />
            <div className="skeleton mx-auto aspect-square w-full max-w-[35rem] rounded-3xl" />
          </div>
        )}

        {failed && (
          <section className="kiwi-panel mt-8 p-8" role="alert">
            <h2 className="text-2xl">Share Card data could not be loaded</h2>
            <p className="mt-2 text-muted-content">Your Passport data is safe. Try loading it again.</p>
            <button
              className="btn btn-primary mt-5"
              onClick={() => void Promise.all([history.refetch(), progression.refetch()])}
              type="button"
            >
              Retry
            </button>
          </section>
        )}

        {!loading && !failed && verified.length === 0 && (
          <section className="kiwi-panel mt-8 px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <IdCard aria-hidden="true" className="size-7" />
            </span>
            <h2 className="mt-5 text-3xl">Complete a verified Quest first</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-content">
              Share Cards use verified Passport records only. Self-reported and
              pending completions are never presented as verified.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link className="btn btn-primary" to="/my-quests">
                <Target aria-hidden="true" className="size-4" /> Open My Quests
              </Link>
              <Link className="btn btn-outline" to="/passport">View Passport</Link>
            </div>
          </section>
        )}

        {!loading && !failed && selected && progression.data && auth.data && (
          <div className="mt-7 grid min-w-0 gap-8 lg:grid-cols-[21.25rem_minmax(0,1fr)] lg:items-start">
            <div className="space-y-4">
              <section className="kiwi-panel p-5" aria-labelledby="completion-choice-heading">
                <h2 className="text-lg" id="completion-choice-heading">Select completion</h2>
                <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
                  {verified.map((item) => (
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
                        selected.completionId === item.completionId
                          ? 'border-primary bg-primary/8'
                          : 'border-base-300 hover:bg-secondary'
                      }`}
                      key={item.completionId}
                    >
                      <input
                        aria-label={item.questTitle}
                        checked={selected.completionId === item.completionId}
                        className="radio radio-primary radio-sm mt-0.5"
                        name="completion"
                        onChange={() => setSelectedId(item.completionId)}
                        type="radio"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{item.questTitle}</span>
                        <span className="mt-1 block text-xs text-muted-content">
                          {new Date(item.completedAtUtc).toLocaleDateString()} ·{' '}
                          {item.xpAmount === null ? 'XP pending' : `+${item.xpAmount} XP`}
                        </span>
                        {badgeSpecsFor(item).length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {badgeSpecsFor(item).slice(0, 6).map((badge) => (
                              <AchievementBadgeArt
                                code={badge.code}
                                key={badge.label}
                                label={badge.label}
                                size={22}
                                unlocked
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="kiwi-panel p-5" aria-labelledby="visual-theme-heading">
                <h2 className="text-lg" id="visual-theme-heading">Visual theme</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SHARE_CARD_THEMES.map((value) => (
                    <button
                      aria-pressed={theme === value}
                      className={`rounded-2xl border px-2 py-3 text-xs font-bold capitalize ${
                        theme === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-base-300 hover:bg-secondary'
                      }`}
                      key={value}
                      onClick={() => setTheme(value)}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className={`relative mx-auto mb-2 block h-9 overflow-hidden rounded-xl ${
                          value === 'forest'
                            ? 'bg-emerald-950 before:absolute before:inset-x-0 before:bottom-0 before:h-5 before:rounded-t-[100%] before:bg-emerald-500'
                            : value === 'ocean'
                              ? 'bg-slate-900 before:absolute before:inset-x-0 before:bottom-1 before:h-3 before:rounded-[50%] before:border-t-4 before:border-sky-300'
                              : 'bg-orange-950 before:absolute before:bottom-0 before:right-2 before:size-7 before:rounded-t-full before:bg-amber-300'
                        }`}
                      />
                      {THEME_LABELS[value]}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm font-bold">Overlay</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SHARE_CARD_OVERLAYS.map((value) => (
                    <button
                      aria-pressed={overlay === value}
                      className={`btn btn-sm ${overlay === value ? 'btn-primary' : 'btn-outline'}`}
                      key={value}
                      onClick={() => setOverlay(value)}
                      type="button"
                    >
                      {value === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </section>

              <section className="kiwi-panel p-5" aria-labelledby="share-options-heading">
                <h2 className="text-lg" id="share-options-heading">Options</h2>
                <label className="mt-3 flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-bold">Show display name</span>
                    <span className="block text-xs text-muted-content">
                      Adds “{auth.data.displayName}” to the card
                    </span>
                  </span>
                  <input
                    checked={showName}
                    className="toggle toggle-primary"
                    onChange={(event) => setShowName(event.target.checked)}
                    type="checkbox"
                  />
                </label>
              </section>

              <div className="grid gap-2">
                <button
                  className="btn btn-primary"
                  disabled={!exportReady}
                  onClick={() => void download()}
                  type="button"
                >
                  <Download aria-hidden="true" className="size-4" /> Download PNG
                </button>
                <button
                  className="btn kiwi-share-action"
                  disabled={!exportReady}
                  onClick={() => void share()}
                  type="button"
                >
                  <Share2 aria-hidden="true" className="size-4" /> Share
                </button>
                {!exportReady && (
                  <p className="text-xs text-muted-content" role="status">
                    Preparing trophy and badge artwork…
                  </p>
                )}
              </div>
              {message && <p className="text-sm text-muted-content" role="status">{message}</p>}

              <aside className="rounded-2xl border border-base-300 bg-secondary/65 p-4 text-xs text-muted-content">
                <p className="flex items-center gap-2 font-bold text-base-content">
                  <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                  Privacy — never shown on card
                </p>
                <ul className="mt-2 grid gap-1.5">
                  {[
                    'Home Community or precise location',
                    'Evidence or claim text',
                    'Email or user ID',
                  ].map((item) => (
                    <li className="flex items-center gap-2" key={item}>
                      <X aria-hidden="true" className="size-3" /> {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <section aria-labelledby="live-preview-heading" className="min-w-0 lg:sticky lg:top-24">
              <div className="mx-auto mb-4 flex max-w-[35rem] items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold" id="live-preview-heading">
                    <Sparkles aria-hidden="true" className="size-4 text-warning" />
                    Live preview
                  </p>
                  <p className="text-xs text-muted-content">
                    This is exactly what the downloaded card will contain.
                    {artworkPending && ' Loading artwork…'}
                  </p>
                </div>
                <span className="badge badge-outline whitespace-nowrap">1080 × 1080 px</span>
              </div>

              <div
                aria-labelledby="share-trophy-heading"
                className="mx-auto mb-4 max-w-[35rem] rounded-3xl border border-base-300 bg-base-100 p-4"
              >
                {achievementProfile.isPending && (
                  <div className="flex items-center gap-3">
                    <div className="skeleton size-14 shrink-0 rounded-2xl" />
                    <p className="text-sm text-muted-content">Loading trophy…</p>
                  </div>
                )}
                {achievementProfile.isError && (
                  <p className="text-sm text-muted-content" role="note">
                    Trophy unavailable — your card still shows the verified completion.
                  </p>
                )}
                {achievementProfile.data && (
                  <div className="flex items-center gap-4">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary/70">
                      <TrophyArtwork
                        size={52}
                        tier={achievementProfile.data.trophy.tier}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="kiwi-stat-label" id="share-trophy-heading">
                        Your trophy on this card
                      </p>
                      <p className="mt-0.5 text-lg font-bold">
                        {achievementProfile.data.trophy.tier === 'Locked'
                          ? 'No trophy yet'
                          : `${achievementProfile.data.trophy.tier} Trophy`}
                      </p>
                      <p className="text-xs text-muted-content">
                        {achievementProfile.data.trophy.tier === 'Locked'
                          ? `Earn ${
                            achievementProfile.data.trophy.nextRequiredCount ?? 5
                          } distinct achievements to light the ${
                            achievementProfile.data.trophy.nextTier ?? 'Bronze'
                          } trophy.`
                          : RARITY_LABELS[achievementProfile.data.trophy.rarity]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <canvas
                aria-label={`Share Card preview for ${selected.questTitle}`}
                className="mx-auto aspect-square w-full max-w-[35rem] rounded-3xl border-2 border-base-300 bg-neutral shadow-2xl"
                ref={canvasRef}
                role="img"
              >
                <CheckCircle2 aria-hidden="true" />
                Verified completion: {selected.questTitle}
              </canvas>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

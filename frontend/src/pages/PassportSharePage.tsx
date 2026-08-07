import {
  ArrowLeft,
  Download,
  IdCard,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AchievementBadgeArt, TrophyArtwork } from '../components/game/GameArtwork.tsx';
import { useAuthQuery } from '../hooks/useAuth.ts';
import {
  useAchievementNationwideStats,
  useMyAchievementProfile,
  useMyAchievements,
} from '../hooks/useAchievements.ts';
import { usePassportSummary } from '../hooks/usePassportCompletions.ts';
import { useProgression } from '../hooks/useProgression.ts';
import { achievementBadgeSvgString, trophySvgString } from '../lib/gameArtworkSvg.ts';
import {
  drawPassportShareCard,
  isCurrentPassportArtwork,
  type PassportShareArtworkIdentity,
} from '../lib/passportShareCard.ts';
import {
  SHARE_CARD_OVERLAYS,
  SHARE_CARD_THEMES,
  type ShareCardOverlay,
  type ShareCardTheme,
} from '../lib/shareCard.ts';
import { loadSvgImage } from '../lib/svgImageLoader.ts';
import type { AchievementRarity } from '../types/achievement.ts';

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

interface PassportArtwork extends PassportShareArtworkIdentity {
  trophyImage: HTMLImageElement | null;
  badgeImages: (HTMLImageElement | null)[];
}

export default function PassportSharePage() {
  const auth = useAuthQuery();
  const progression = useProgression();
  const passport = usePassportSummary();
  const achievementProfile = useMyAchievementProfile();
  const achievements = useMyAchievements();
  const achievementStats = useAchievementNationwideStats();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ShareCardTheme>('forest');
  const [overlay, setOverlay] = useState<ShareCardOverlay>('dark');
  const [showName, setShowName] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<PassportArtwork | null>(null);

  const trophyTier = achievementProfile.data?.trophy.tier;
  const earned = useMemo(() => achievements.data ?? [], [achievements.data]);
  const badgeKeys = useMemo(
    () => earned.map((item) => `${item.code}|${item.name}`),
    [earned],
  );
  const statsById = useMemo(
    () => new Map(
      (achievementStats.data ?? []).map((item) => [item.achievementId, item]),
    ),
    [achievementStats.data],
  );

  useEffect(() => {
    let cancelled = false;
    const trophyPromise = trophyTier
      ? loadSvgImage(trophySvgString(trophyTier, 160))
      : Promise.resolve(null);
    const badgePromises = earned.map((item) => loadSvgImage(
      achievementBadgeSvgString({
        code: item.code,
        label: item.name,
        size: 96,
        unlocked: true,
      }),
    ));
    void Promise.all([trophyPromise, ...badgePromises]).then(
      ([trophyImage, ...badgeImages]) => {
        if (!cancelled) {
          setArtwork({ tier: trophyTier, badgeKeys, trophyImage, badgeImages });
        }
      },
    );
    return () => { cancelled = true; };
  }, [badgeKeys, earned, trophyTier]);

  const activeArtwork = artwork
    && isCurrentPassportArtwork(artwork, trophyTier, badgeKeys)
    ? artwork
    : null;
  const artworkPending = Boolean(
    (trophyTier || earned.length > 0) && !activeArtwork,
  );
  const exportReady = Boolean(auth.data && progression.data && passport.data)
    && !achievementProfile.isPending
    && !achievements.isPending
    && !achievementStats.isPending
    && !artworkPending;

  useEffect(() => {
    if (!canvasRef.current || !auth.data || !progression.data || !passport.data) return;
    drawPassportShareCard(canvasRef.current, {
      achievements: earned.map((item, index) => ({
        label: item.name,
        image: activeArtwork?.badgeImages[index] ?? null,
        rarity: statsById.has(item.achievementId)
          ? RARITY_LABELS[statsById.get(item.achievementId)!.rarity]
          : undefined,
      })),
      displayName: auth.data.displayName,
      overlay,
      passport: passport.data,
      progression: progression.data,
      showName,
      theme,
      trophy: trophyTier
        ? {
            tier: trophyTier,
            image: activeArtwork?.trophyImage ?? null,
            rarity: achievementProfile.data
              ? RARITY_LABELS[achievementProfile.data.trophy.rarity]
              : undefined,
          }
        : undefined,
    });
  }, [activeArtwork, achievementProfile.data, auth.data, earned, overlay, passport.data, progression.data, showName, statsById, theme, trophyTier]);

  function createBlob(): Promise<Blob | null> {
    return new Promise((resolve) => canvasRef.current?.toBlob(resolve, 'image/png'));
  }

  async function download() {
    if (!exportReady) return;
    setMessage(null);
    const blob = await createBlob();
    if (!blob) {
      setMessage('The Passport image could not be prepared. Please try again.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'kiwimpact-passport.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Passport downloaded.');
  }

  async function share() {
    if (!exportReady) return;
    setMessage(null);
    const blob = await createBlob();
    if (!blob) {
      setMessage('The Passport image could not be prepared. Please try again.');
      return;
    }
    const file = new File([blob], 'kiwimpact-passport.png', { type: 'image/png' });
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) {
      setMessage('Image sharing is not available in this browser. Download the PNG instead.');
      return;
    }
    try {
      await navigator.share({
        files: [file],
        text: 'My Kiwimpact Personal Impact Passport.',
        title: 'My Kiwimpact Passport',
      });
      setMessage('Passport image ready to share.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Sharing was not completed. You can download the PNG instead.');
    }
  }

  const loading = progression.isPending || passport.isPending;
  const failed = progression.isError || passport.isError;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-base-200 py-8">
      <main className="kiwi-page">
        <Link className="btn btn-ghost btn-sm -ml-3 mb-5" to="/passport">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to Passport
        </Link>
        <header>
          <p className="kiwi-stat-label">Your complete impact story</p>
          <h1 className="mt-1 kiwi-page-heading">Share your Passport</h1>
          <p className="kiwi-page-intro mt-1 max-w-2xl">
            Create one privacy-safe snapshot of your progress, trophy, and every earned achievement.
          </p>
        </header>

        {loading && <div className="skeleton mt-8 h-[36rem] rounded-3xl" aria-label="Loading Passport share" />}
        {failed && (
          <section className="kiwi-panel mt-8 p-8" role="alert">
            <h2 className="text-2xl">Passport data could not be loaded</h2>
            <button className="btn btn-primary mt-5" onClick={() => void Promise.all([progression.refetch(), passport.refetch()])} type="button">Retry</button>
          </section>
        )}

        {!loading && !failed && auth.data && progression.data && passport.data && (
          <div className="mt-7 grid min-w-0 gap-8 lg:grid-cols-[21.25rem_minmax(0,1fr)] lg:items-start">
            <div className="space-y-4">
              <section className="kiwi-panel p-5" aria-labelledby="passport-contents-heading">
                <p className="kiwi-stat-label">Whole Passport</p>
                <h2 className="mt-1 text-xl" id="passport-contents-heading">Included in this snapshot</h2>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-secondary/65 p-3"><dt className="text-xs text-muted-content">Level</dt><dd className="font-bold">{progression.data.level}</dd></div>
                  <div className="rounded-2xl bg-secondary/65 p-3"><dt className="text-xs text-muted-content">Total XP</dt><dd className="font-bold">{progression.data.totalXp}</dd></div>
                  <div className="rounded-2xl bg-secondary/65 p-3"><dt className="text-xs text-muted-content">Verified Quests</dt><dd className="font-bold">{passport.data.verifiedCompletionCount}</dd></div>
                  <div className="rounded-2xl bg-secondary/65 p-3"><dt className="text-xs text-muted-content">Achievements</dt><dd className="font-bold">{earned.length}</dd></div>
                </dl>
              </section>

              <section className="kiwi-panel p-5" aria-labelledby="passport-art-heading">
                <h2 className="text-lg" id="passport-art-heading">Trophy and achievements</h2>
                {achievementProfile.data && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/65 p-3">
                    <TrophyArtwork size={54} tier={achievementProfile.data.trophy.tier} />
                    <div><p className="font-bold">{achievementProfile.data.trophy.tier === 'Locked' ? 'First trophy awaits' : `${achievementProfile.data.trophy.tier} Trophy`}</p><p className="text-xs text-muted-content">{RARITY_LABELS[achievementProfile.data.trophy.rarity]} nationwide rarity</p></div>
                  </div>
                )}
                {achievementProfile.isError && <p className="mt-3 text-sm text-muted-content">Trophy unavailable; the rest of your Passport remains shareable.</p>}
                <div className="mt-4 grid grid-cols-2 gap-2" aria-label="All earned achievement logos">
                  {earned.map((item) => (
                    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-base-300 p-2" key={item.achievementId}>
                      <AchievementBadgeArt code={item.code} label={item.name} size={42} unlocked />
                      <span className="min-w-0"><span className="block truncate text-xs font-bold">{item.name}</span><span className="block text-[0.68rem] text-muted-content">{statsById.has(item.achievementId) ? RARITY_LABELS[statsById.get(item.achievementId)!.rarity] : 'Rarity unavailable'}</span></span>
                    </div>
                  ))}
                  {!achievements.isPending && earned.length === 0 && <p className="text-sm text-muted-content">Your first achievement awaits.</p>}
                </div>
              </section>

              <section className="kiwi-panel p-5" aria-labelledby="passport-theme-heading">
                <h2 className="text-lg" id="passport-theme-heading">Visual style</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SHARE_CARD_THEMES.map((value) => (
                    <button aria-pressed={theme === value} className={`btn btn-sm ${theme === value ? 'btn-primary' : 'btn-outline'}`} key={value} onClick={() => setTheme(value)} type="button">{THEME_LABELS[value]}</button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SHARE_CARD_OVERLAYS.map((value) => (
                    <button aria-pressed={overlay === value} className={`btn btn-sm ${overlay === value ? 'btn-primary' : 'btn-outline'}`} key={value} onClick={() => setOverlay(value)} type="button">{value === 'light' ? 'Light' : 'Dark'}</button>
                  ))}
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-bold">Show display name</span><span className="block text-xs text-muted-content">Off by default for privacy</span></span><input checked={showName} className="toggle toggle-primary" onChange={(event) => setShowName(event.target.checked)} type="checkbox" /></label>
              </section>

              <div className="grid gap-2">
                <button className="btn btn-primary" disabled={!exportReady} onClick={() => void download()} type="button"><Download aria-hidden="true" className="size-4" />Download Passport PNG</button>
                <button className="btn btn-outline" disabled={!exportReady} onClick={() => void share()} type="button"><Share2 aria-hidden="true" className="size-4" />Share Passport PNG</button>
                {!exportReady && <p className="text-xs text-muted-content" role="status">Preparing trophy and all achievement artwork…</p>}
              </div>
              {message && <p className="text-sm text-muted-content" role="status">{message}</p>}
              <aside className="rounded-2xl border border-base-300 bg-secondary/65 p-4 text-xs text-muted-content">
                <p className="flex items-center gap-2 font-bold text-base-content"><ShieldCheck aria-hidden="true" className="size-4 text-primary" />Never included</p>
                <p className="mt-2">Home Community, precise location, email, user ID, evidence, and claim text.</p>
              </aside>
              <Link className="btn btn-ghost btn-sm justify-start" to="/passport/share/completion"><IdCard aria-hidden="true" className="size-4" />Create a card for one Quest instead</Link>
            </div>

            <section aria-labelledby="passport-preview-heading" className="min-w-0 lg:sticky lg:top-24">
              <div className="mx-auto mb-4 flex max-w-[35rem] items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold" id="passport-preview-heading"><Sparkles aria-hidden="true" className="size-4 text-warning" />Whole Passport preview</p><p className="text-xs text-muted-content">This is exactly what the downloaded image contains.</p></div><span className="badge badge-outline whitespace-nowrap">1080 × 1080 px</span></div>
              <canvas aria-label={`Passport share preview for ${auth.data.displayName}`} className="mx-auto aspect-square w-full max-w-[35rem] rounded-3xl border-2 border-base-300 bg-neutral shadow-2xl" ref={canvasRef} role="img">Personal Impact Passport preview</canvas>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

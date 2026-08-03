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
import { useAuthQuery } from '../hooks/useAuth.ts';
import { useAllPassportCompletions } from '../hooks/usePassportCompletions.ts';
import { useProgression } from '../hooks/useProgression.ts';
import {
  drawShareCard,
  SHARE_CARD_OVERLAYS,
  SHARE_CARD_THEMES,
  type ShareCardOverlay,
  type ShareCardTheme,
} from '../lib/shareCard.ts';

const THEME_LABELS: Record<ShareCardTheme, string> = {
  forest: 'Forest',
  ocean: 'Ocean',
  sunrise: 'Sunrise',
};

export default function ShareCardBuilderPage() {
  const auth = useAuthQuery();
  const progression = useProgression();
  const history = useAllPassportCompletions();
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

  const verified = useMemo(
    () => history.data?.filter((item) => item.status === 'Verified') ?? [],
    [history.data],
  );
  const selected = verified.find((item) => item.completionId === selectedId)
    ?? verified[0];

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
    if (!canvasRef.current || !selected || !progression.data || !auth.data) return;
    drawShareCard(canvasRef.current, {
      completion: selected,
      displayName: auth.data.displayName,
      overlay,
      progression: progression.data,
      showName,
      theme,
    });
  }, [auth.data, overlay, progression.data, selected, showName, theme]);

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
                <button className="btn btn-primary" onClick={() => void download()} type="button">
                  <Download aria-hidden="true" className="size-4" /> Download PNG
                </button>
                <button className="btn btn-outline" onClick={() => void share()} type="button">
                  <Share2 aria-hidden="true" className="size-4" /> Share
                </button>
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
                  </p>
                </div>
                <span className="badge badge-outline whitespace-nowrap">1080 × 1080 px</span>
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

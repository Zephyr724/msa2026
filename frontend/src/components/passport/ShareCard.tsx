import { Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { PassportCompletionItem } from '../../types/passport';
import type { MyProgression } from '../../types/progression';

interface ShareCardProps {
  displayName: string;
  progression: MyProgression;
  completion?: PassportCompletionItem;
}

export default function ShareCard({
  displayName,
  progression,
  completion,
}: ShareCardProps) {
  const [showName, setShowName] = useState(false);

  function download() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#064e3b');
    gradient.addColorStop(1, '#10b981');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 630);
    context.fillStyle = '#d1fae5';
    context.font = '700 32px system-ui';
    context.fillText('KIWIMPACT • VERIFIED IMPACT', 72, 88);
    context.fillStyle = '#ffffff';
    context.font = '800 68px system-ui';
    context.fillText(
      completion ? completion.questTitle.slice(0, 28) : 'My impact journey',
      72,
      210,
    );
    context.font = '700 42px system-ui';
    context.fillText(`${progression.totalXp} XP • Level ${progression.level}`, 72, 300);
    context.font = '500 30px system-ui';
    context.fillText(progression.rankTitle, 72, 358);
    if (completion) {
      context.fillText(
        `${completion.status} • ${new Date(completion.completedAtUtc).toLocaleDateString()}`,
        72,
        425,
      );
    }
    if (showName) {
      context.font = '600 30px system-ui';
      context.fillText(displayName.slice(0, 60), 72, 535);
    }
    const link = document.createElement('a');
    link.download = 'kiwimpact-share-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <section className="kiwi-panel p-5" aria-labelledby="share-card-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Share2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="kiwi-stat-label">Privacy-safe sharing</p>
          <h2 className="mt-1 text-2xl" id="share-card-heading">Share Card</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Includes progress and an optional verified Quest. Community, email,
            evidence, and account identifiers are never included.
          </p>
        </div>
      </div>
      <label className="label mt-4 cursor-pointer justify-start gap-3">
        <input
          checked={showName}
          className="toggle toggle-primary"
          onChange={(event) => setShowName(event.target.checked)}
          type="checkbox"
        />
        <span>Show my display name</span>
      </label>
      <button className="btn btn-primary btn-sm mt-3" onClick={download} type="button">
        <Download className="size-4" /> Download PNG
      </button>
    </section>
  );
}

import { ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PassportCompletionItem } from '../../types/passport';

interface ShareCardProps {
  completion?: PassportCompletionItem;
}

export default function ShareCard({ completion }: ShareCardProps) {
  return (
    <section className="kiwi-panel flex flex-col p-5" aria-labelledby="share-card-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Share2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="kiwi-stat-label">Privacy-safe sharing</p>
          <h2 className="mt-1 text-2xl" id="share-card-heading">Share Card</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Build a square card from your verified impact, with privacy-safe
            controls and a live preview.
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-secondary/65 p-3 text-sm text-base-content/65">
        {completion
          ? `Ready to feature “${completion.questTitle}”.`
          : 'Complete a verified Quest to unlock your first card.'}
      </p>
      <Link className="btn btn-primary btn-sm mt-auto self-start rounded-full" to="/passport/share">
        Open builder <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

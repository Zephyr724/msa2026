import { ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function ShareCard() {
  return (
    <section className="kiwi-panel flex flex-col p-5" aria-labelledby="share-card-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Share2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="kiwi-stat-label">Privacy-safe sharing</p>
          <h2 className="mt-1 text-2xl" id="share-card-heading">Share your Passport</h2>
          <p className="mt-1 text-sm text-muted-content">
            Create a privacy-safe snapshot of your level, impact, trophy, and
            every achievement you have earned.
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-secondary/65 p-3 text-sm text-muted-content">
        Your community, account details, evidence, and claim text are never included.
      </p>
      <Link className="btn kiwi-share-action btn-sm mt-auto self-start rounded-full" to="/passport/share">
        Open Passport share <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}

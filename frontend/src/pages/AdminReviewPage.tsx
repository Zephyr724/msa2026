import { CheckCircle2, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth';
import {
  useAdminClaim, usePendingClaims, useReviewEvidenceClaim,
} from '../hooks/useCompletion';

export default function AdminReviewPage() {
  const auth = useAuthQuery();
  const isAdmin = auth.data?.roles.includes('Admin') ?? false;
  const queue = usePendingClaims(isAdmin);
  const [selected, setSelected] = useState('');
  const detail = useAdminClaim(selected);
  const review = useReviewEvidenceClaim(selected);
  const [note, setNote] = useState('');

  if (!isAdmin) {
    return <main className="kiwi-page py-16"><div className="alert alert-error">Admin access required.</div></main>;
  }

  async function decide(approve: boolean) {
    await review.mutateAsync({ approve, reviewNote: note });
    setSelected('');
    setNote('');
  }

  return (
    <main className="kiwi-page py-10">
      <header>
        <p className="kiwi-stat-label">Trusted impact</p>
        <h1 className="mt-2 text-4xl">Evidence review</h1>
        <p className="mt-2 text-muted-content">Private evidence is visible only in this review workflow.</p>
      </header>
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="kiwi-panel p-5">
          <h2 className="text-xl">Pending queue</h2>
          {queue.isPending && <p className="mt-4">Loading claims…</p>}
          {queue.data?.length === 0 && <p className="mt-4 text-muted-content">Queue cleared.</p>}
          <ul className="mt-4 space-y-2">
            {queue.data?.map((item) => (
              <li key={item.claimId}>
                <button className={`w-full rounded-2xl border p-4 text-left ${selected === item.claimId ? 'border-primary bg-primary/8' : 'border-base-300'}`}
                  onClick={() => setSelected(item.claimId)} type="button">
                  <span className="font-bold">{item.questTitle}</span>
                  <span className="mt-1 block text-xs text-muted-content">
                    Submitted {new Date(item.createdAtUtc).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="kiwi-panel p-5">
          {!selected && <div className="grid min-h-64 place-items-center text-muted-content">Select a claim to review.</div>}
          {detail.isPending && selected && <p>Loading private evidence…</p>}
          {detail.data && (
            <>
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div><h2 className="text-2xl">{detail.data.questTitle}</h2>
                  <p className="text-sm text-muted-content">Claim {detail.data.claimId}</p></div>
              </div>
              <dl className="mt-6 space-y-4">
                <div><dt className="kiwi-stat-label">Member statement</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{detail.data.description ?? 'Purged'}</dd></div>
                <div><dt className="kiwi-stat-label">Completed</dt>
                  <dd className="mt-1">{new Date(detail.data.completedAtUtc).toLocaleDateString()}</dd></div>
              </dl>
              {detail.data.evidenceUrl && (
                <a className="btn btn-outline btn-sm mt-5" href={detail.data.evidenceUrl}
                  rel="noopener noreferrer" target="_blank">Open evidence <ExternalLink className="size-4" /></a>
              )}
              <textarea aria-label="Review note" className="textarea textarea-bordered mt-6 w-full"
                maxLength={500} onChange={(e) => setNote(e.target.value)}
                placeholder="Private review note (optional)" value={note} />
              {review.isError && <div className="alert alert-error mt-4">Review could not be saved.</div>}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="btn btn-error btn-outline" disabled={review.isPending}
                  onClick={() => void decide(false)} type="button"><XCircle className="size-4" /> Reject</button>
                <button className="btn btn-success" disabled={review.isPending}
                  onClick={() => void decide(true)} type="button"><CheckCircle2 className="size-4" /> Approve</button>
              </div>
            </>
          )}
        </section>
      </div>
      <Link className="link link-primary mt-6 inline-block" to="/passport">Back to Passport</Link>
    </main>
  );
}

import { FileCheck2, NotebookPen } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuthQuery } from '../../hooks/useAuth';
import {
  useMyQuestCompletionQuery,
  useSelfReportCompletion,
  useSubmitEvidenceClaim,
} from '../../hooks/useCompletion';
import { ApiError } from '../../lib/api/apiFetch';

export default function TrustedCompletionPanel({
  mode: controlledMode,
  questId,
}: {
  mode?: 'claim' | 'self';
  questId: string;
}) {
  const auth = useAuthQuery();
  const state = useMyQuestCompletionQuery(questId);
  const claim = useSubmitEvidenceClaim(questId);
  const selfReport = useSelfReportCompletion(questId);
  const [mode, setMode] = useState<'claim' | 'self'>('claim');
  const selectedMode = controlledMode ?? mode;
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [completedDate, setCompletedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [declared, setDeclared] = useState(false);

  if (!auth.data || state.isPending || !state.data) return null;
  if (state.data.status === 'Verified') return null;

  const mutation = selectedMode === 'claim' ? claim : selfReport;
  const error = mutation.error instanceof ApiError
    ? mutation.error.problem?.detail ?? 'The completion could not be saved.'
    : mutation.isError ? 'The completion could not be saved.' : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    // The API expects an instant, so encode the date at a fixed UTC time
    // instead of relying on browser-specific parsing of a date-only string.
    const completedAtUtc = new Date(`${completedDate}T12:00:00Z`).toISOString();
    if (selectedMode === 'claim') {
      await claim.mutateAsync({
        description,
        evidenceUrl: evidenceUrl.trim() || null,
        userDeclaration: declared,
        completedAtUtc,
      });
    } else {
      await selfReport.mutateAsync(completedAtUtc);
    }
  }

  if (state.data.status === 'Pending') {
    return (
      <section className="kiwi-panel p-5">
        <p className="font-bold text-warning">Evidence under review</p>
        <p className="mt-2 text-sm text-muted-content">
          Your private evidence is waiting for an Admin decision.
        </p>
      </section>
    );
  }

  return (
    <section className="kiwi-panel p-5">
      <h2 className="text-xl">Record your impact</h2>
      {controlledMode === undefined && (
        <div className="tabs tabs-box mt-4 grid grid-cols-2" role="tablist">
          <button className={`tab ${selectedMode === 'claim' ? 'tab-active' : ''}`}
            onClick={() => setMode('claim')} role="tab" type="button">
            <FileCheck2 className="mr-1 size-4" /> Verify
          </button>
          <button className={`tab ${selectedMode === 'self' ? 'tab-active' : ''}`}
            onClick={() => setMode('self')} role="tab" type="button">
            <NotebookPen className="mr-1 size-4" /> Self-report
          </button>
        </div>
      )}
      <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}>
        <label className="form-control block">
          <span className="mb-1 block text-sm font-bold">Completion date</span>
          <input className="input input-bordered w-full" max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setCompletedDate(event.target.value)}
            required type="date" value={completedDate} />
        </label>
        {selectedMode === 'claim' && (
          <>
            <label className="form-control block">
              <span className="mb-1 block text-sm font-bold">What did you do?</span>
              <textarea className="textarea textarea-bordered w-full" maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                required value={description} />
            </label>
            <label className="form-control block">
              <span className="mb-1 block text-sm font-bold">Evidence link (HTTPS, optional)</span>
              <input className="input input-bordered w-full" onChange={(event) => setEvidenceUrl(event.target.value)}
                placeholder="https://" type="url" value={evidenceUrl} />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input checked={declared} className="checkbox checkbox-primary checkbox-sm mt-0.5"
                onChange={(event) => setDeclared(event.target.checked)} required type="checkbox" />
              I confirm this account is accurate.
            </label>
          </>
        )}
        {selectedMode === 'self' && (
          <p className="rounded-2xl bg-base-200 p-3 text-sm text-muted-content">
            Self-reports appear in your Passport but do not award XP or leaderboard progress.
          </p>
        )}
        {error && <div className="alert alert-error text-sm" role="alert">{error}</div>}
        <button className="btn btn-primary w-full" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? 'Saving…' : selectedMode === 'claim' ? 'Submit evidence' : 'Save self-report'}
        </button>
      </form>
    </section>
  );
}

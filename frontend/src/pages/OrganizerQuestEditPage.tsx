import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QuestForm from '../components/organizer/QuestForm';
import { questDetailToFormValues } from '../components/organizer/questFormModel';
import QuestLifecycleActions from '../components/organizer/QuestLifecycleActions';
import { ManagementForbidden } from '../components/organizer/RequireManagementAccess';
import { QuestStatusBadge } from './OrganizerQuestListPage';
import {
  organizerQuestKeys,
  useOrganizerQuestDetailQuery,
  useUpdateQuestMutation,
} from '../hooks/useOrganizerQuests';
import { ApiError } from '../lib/api/apiFetch';
import type { CreateQuestInput } from '../types/questManagement';

export default function OrganizerQuestEditPage() {
  const { questId = '' } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useOrganizerQuestDetailQuery(questId);
  const update = useUpdateQuestMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [formRevision, setFormRevision] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      setSessionExpired(true);
    }
  }, [query.error]);

  useEffect(() => {
    if (sessionExpired) navigate('/login', { replace: true });
  }, [navigate, sessionExpired]);

  async function handleSubmit(input: CreateQuestInput) {
    if (!query.data) throw new Error('Quest detail is unavailable.');
    setServerError(null);
    setConflict(null);
    try {
      const result = await update.mutateAsync({
        id: query.data.id,
        input: { ...input, version: query.data.version },
      });
      setStatusMessage('Quest changes saved.');
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSessionExpired(true);
      } else if (error instanceof ApiError && error.status === 403) {
        setForbidden(true);
      } else if (error instanceof ApiError && error.status === 409) {
        setConflict(error.problem?.detail ?? 'This quest was changed by someone else.');
      } else {
        setServerError(
          error instanceof ApiError
            ? error.problem?.detail ?? 'The quest could not be saved.'
            : 'The quest could not be saved. Please try again.',
        );
      }
      throw error;
    }
  }

  async function reloadLatest() {
    await queryClient.invalidateQueries({ queryKey: organizerQuestKeys.detail(questId) });
    setConflict(null);
    setServerError(null);
    setFormRevision((value) => value + 1);
  }

  if (query.isPending) {
    return (
      <main aria-live="polite" className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <p className="sr-only">Loading quest editor…</p>
        <div className="skeleton h-10 w-72" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-96 w-full" />
      </main>
    );
  }

  if (forbidden || (query.error instanceof ApiError && query.error.status === 403)) {
    return <ManagementForbidden questSpecific />;
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Managed quest not found</h1>
        <p className="mt-4">This quest does not exist or is no longer available to manage.</p>
        <Link className="btn btn-primary mt-6" to="/organizer/quests">Back to managed quests</Link>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Unable to load managed quest</h1>
        <p className="mt-4">Something went wrong while loading this quest.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn btn-primary" onClick={() => query.refetch()} type="button">Retry</button>
          <Link className="btn btn-ghost" to="/organizer/quests">Back to managed quests</Link>
        </div>
      </main>
    );
  }

  const quest = query.data;
  const archived = quest.status === 'Archived';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link className="btn btn-ghost btn-sm mb-4" to="/organizer/quests">
        &larr; Back to managed quests
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{archived ? 'View quest' : 'Edit quest'}</h1>
            <QuestStatusBadge status={quest.status} />
          </div>
          <p className="mt-2 text-base-content/65">{quest.title}</p>
        </div>
        {!archived && (
          <QuestLifecycleActions
            disabled={dirty}
            onForbidden={() => setForbidden(true)}
            onSuccessMessage={setStatusMessage}
            quest={quest}
          />
        )}
      </div>

      {dirty && !archived && (
        <p className="mt-3 text-sm text-warning">
          Save or discard form changes before using lifecycle actions.
        </p>
      )}
      {statusMessage && <p className="mt-4" role="status">{statusMessage}</p>}
      {archived && (
        <div className="alert mt-6">
          <span>This archived quest is retained as read-only management history.</span>
        </div>
      )}

      <ReadOnlyMetadata quest={quest} />

      {conflict && (
        <section className="alert alert-warning my-6 items-start" role="alert">
          <div>
            <h2 className="font-bold">A newer version is available</h2>
            <p>{conflict}</p>
            <p className="mt-1 text-sm">Your unsaved input remains on screen until you reload.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-warning btn-sm" onClick={reloadLatest} type="button">
                Reload latest version
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConflict(null)} type="button">
                Keep editing
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8">
        <QuestForm
          disableNavigationProtection={sessionExpired}
          initialValues={questDetailToFormValues(quest)}
          key={`${quest.id}:${formRevision}`}
          onClearServerError={() => setServerError(null)}
          onDirtyChange={setDirty}
          onSubmit={handleSubmit}
          pendingLabel="Saving…"
          readOnly={archived}
          serverError={serverError}
          submitLabel="Save changes"
          submitting={update.isPending}
        />
      </div>
    </main>
  );
}

function ReadOnlyMetadata({
  quest,
}: {
  quest: NonNullable<ReturnType<typeof useOrganizerQuestDetailQuery>['data']>;
}) {
  return (
    <section className="mt-6 rounded-box bg-base-100 p-4 shadow-sm" aria-labelledby="management-metadata">
      <h2 className="font-semibold" id="management-metadata">Server-managed details</h2>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="font-medium">Source type</dt><dd>{quest.sourceType}</dd></div>
        <div><dt className="font-medium">XP award</dt><dd>{quest.xpAward}</dd></div>
        <div><dt className="font-medium">External source status</dt><dd>{quest.externalSourceStatus ?? 'Not applicable'}</dd></div>
        <div><dt className="font-medium">Last source check</dt><dd>{formatTimestamp(quest.sourceCheckedAtUtc)}</dd></div>
        <div><dt className="font-medium">Next source check</dt><dd>{formatTimestamp(quest.nextCheckDueAtUtc)}</dd></div>
        <div><dt className="font-medium">Last updated</dt><dd>{formatTimestamp(quest.updatedAtUtc)}</dd></div>
      </dl>
    </section>
  );
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not applicable';
}

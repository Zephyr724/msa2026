import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuestLifecycleActions from '../components/organizer/QuestLifecycleActions';
import { ManagementForbidden } from '../components/organizer/RequireManagementAccess';
import { useOrganizerQuestListQuery } from '../hooks/useOrganizerQuests';
import { ApiError } from '../lib/api/apiFetch';
import type {
  QuestManagementListItemDto,
  QuestStatus,
} from '../types/questManagement';

const STATUS_CLASSES: Record<QuestStatus, string> = {
  Draft: 'badge-warning',
  Published: 'badge-success',
  Cancelled: 'badge-error',
  Archived: 'badge-neutral',
};

export function QuestStatusBadge({ status }: { status: QuestStatus }) {
  return <span className={`badge ${STATUS_CLASSES[status]}`}>{status}</span>;
}

export default function OrganizerQuestListPage() {
  const navigate = useNavigate();
  const query = useOrganizerQuestListQuery();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      navigate('/login', { replace: true });
    }
  }, [navigate, query.error]);

  if (query.isPending) {
    return (
      <main aria-live="polite" className="container mx-auto px-4 py-8">
        <p className="sr-only">Loading managed quests…</p>
        <div className="skeleton h-10 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="skeleton h-56 rounded-box" key={index} />
          ))}
        </div>
      </main>
    );
  }

  if (forbidden || (query.error instanceof ApiError && query.error.status === 403)) {
    return <ManagementForbidden />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage quests</h1>
          <p className="mt-1 text-base-content/65">Create and maintain quests you can manage.</p>
        </div>
        <Link className="btn btn-primary" to="/organizer/quests/new">Create quest</Link>
      </div>

      {statusMessage && <p className="mt-4" role="status">{statusMessage}</p>}

      {query.isError && !(query.error instanceof ApiError
        && (query.error.status === 401 || query.error.status === 403)) && (
        <div className="alert alert-error mt-6">
          <span>Managed quests could not be loaded. Please try again.</span>
          <button className="btn btn-sm" onClick={() => query.refetch()} type="button">Retry</button>
        </div>
      )}

      {query.data?.length === 0 && (
        <section className="mt-8 rounded-box bg-base-100 p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold">No quests yet</h2>
          <p className="mt-2 text-base-content/65">Create a draft to start planning your first quest.</p>
          <Link className="btn btn-primary mt-5" to="/organizer/quests/new">Create quest</Link>
        </section>
      )}

      {query.data && query.data.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {query.data.map((quest) => (
            <ManagedQuestCard
              key={quest.id}
              onForbidden={() => setForbidden(true)}
              onSuccessMessage={setStatusMessage}
              quest={quest}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ManagedQuestCard({
  quest,
  onSuccessMessage,
  onForbidden,
}: {
  quest: QuestManagementListItemDto;
  onSuccessMessage: (message: string) => void;
  onForbidden: () => void;
}) {
  const readOnly = quest.status === 'Archived';
  return (
    <article className="card bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="card-title text-xl">{quest.title}</h2>
          <QuestStatusBadge status={quest.status} />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-outline">{quest.category}</span>
          <span className="badge badge-outline">{quest.difficulty}</span>
        </div>
        <dl className="space-y-1 text-sm text-base-content/70">
          <div><dt className="inline font-medium">Region: </dt><dd className="inline">{quest.locationRegion?.name ?? 'None'}</dd></div>
          <div><dt className="inline font-medium">Starts: </dt><dd className="inline">{formatDate(quest.startAtUtc)}</dd></div>
          <div><dt className="inline font-medium">Capacity: </dt><dd className="inline">{quest.capacity ?? 'Unlimited'}</dd></div>
        </dl>
        <div className="card-actions mt-auto items-center">
          <Link className="btn btn-ghost btn-sm" to={`/organizer/quests/${quest.id}/edit`}>
            {readOnly ? 'View' : 'Edit'}
          </Link>
          <QuestLifecycleActions
            onForbidden={onForbidden}
            onSuccessMessage={onSuccessMessage}
            quest={quest}
          />
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not scheduled';
}

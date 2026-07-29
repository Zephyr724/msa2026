import { ClipboardList, Plus, Search } from 'lucide-react';
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
      <main aria-live="polite" className="kiwi-page py-10">
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
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
    <main className="kiwi-page">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="kiwi-stat-label">Organizer workspace</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Manage quests</h1>
          <p className="mt-2 text-muted-content">Create, publish, and maintain quests you can manage.</p>
        </div>
        <Link className="btn btn-primary rounded-full" to="/organizer/quests/new">
          <Plus aria-hidden="true" className="size-4" />
          Create quest
        </Link>
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
        <section className="kiwi-panel mt-8 p-10 text-center">
          <Search aria-hidden="true" className="mx-auto size-8 text-primary" />
          <h2 className="mt-4 text-2xl">No quests yet</h2>
          <p className="mt-2 text-muted-content">Create a draft to start planning your first quest.</p>
          <Link className="btn btn-primary mt-5 rounded-full" to="/organizer/quests/new">Create quest</Link>
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
    </div>
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
    <article className="kiwi-card-hover card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList aria-hidden="true" className="size-5" />
          </span>
          <QuestStatusBadge status={quest.status} />
        </div>
        <h2 className="card-title text-xl">{quest.title}</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-outline">{quest.category}</span>
          <span className="badge badge-outline">{quest.difficulty}</span>
        </div>
        <dl className="space-y-1 text-sm text-muted-content">
          <div><dt className="inline font-medium">Region: </dt><dd className="inline">{quest.locationRegion?.name ?? 'None'}</dd></div>
          <div><dt className="inline font-medium">Starts: </dt><dd className="inline">{formatDate(quest.startAtUtc)}</dd></div>
          <div><dt className="inline font-medium">Capacity: </dt><dd className="inline">{quest.capacity ?? 'Unlimited'}</dd></div>
        </dl>
        <div className="card-actions mt-auto items-center">
          <Link className="btn btn-outline btn-sm rounded-full" to={`/organizer/quests/${quest.id}/edit`}>
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

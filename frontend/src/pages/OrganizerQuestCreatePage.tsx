import { ArrowLeft, FilePlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuestForm from '../components/organizer/QuestForm';
import { emptyQuestFormValues } from '../components/organizer/questFormModel';
import { ManagementForbidden } from '../components/organizer/RequireManagementAccess';
import { useCreateQuestMutation } from '../hooks/useOrganizerQuests';
import { ApiError } from '../lib/api/apiFetch';
import type { CreateQuestInput } from '../types/questManagement';

export default function OrganizerQuestCreatePage() {
  const navigate = useNavigate();
  const create = useCreateQuestMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionExpired) navigate('/login', { replace: true });
  }, [navigate, sessionExpired]);

  async function handleSubmit(input: CreateQuestInput) {
    setServerError(null);
    try {
      return await create.mutateAsync(input);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSessionExpired(true);
      } else if (error instanceof ApiError && error.status === 403) {
        setForbidden(true);
      } else {
        setServerError(
          error instanceof ApiError
            ? error.problem?.detail ?? 'The quest could not be created.'
            : 'The quest could not be created. Please try again.',
        );
      }
      throw error;
    }
  }

  if (forbidden) return <ManagementForbidden questSpecific />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-10 sm:py-14">
    <main className="kiwi-page max-w-4xl">
      <Link className="btn btn-ghost btn-sm mb-5 rounded-full" to="/organizer/quests">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to managed quests
      </Link>
      <p className="kiwi-stat-label">Organizer workspace</p>
      <h1 className="mt-2 flex items-center gap-3 text-4xl">
        <FilePlus2 aria-hidden="true" className="size-8 text-primary" />
        Create quest
      </h1>
      <p className="mb-8 mt-2 text-muted-content">
        New quests are saved as drafts. You can review and publish after creation.
      </p>
      <QuestForm
        disableNavigationProtection={sessionExpired}
        initialValues={emptyQuestFormValues}
        onClearServerError={() => setServerError(null)}
        onSubmit={handleSubmit}
        onSubmitted={(quest) => navigate(`/organizer/quests/${quest.id}/edit`)}
        pendingLabel="Creating…"
        serverError={serverError}
        submitLabel="Create draft"
        submitting={create.isPending}
      />
    </main>
    </div>
  );
}

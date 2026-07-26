import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuthQuery } from '../../hooks/useAuth';

export function ManagementForbidden({
  questSpecific = false,
}: {
  questSpecific?: boolean;
}) {
  return (
    <section className="kiwi-panel mx-auto my-16 max-w-2xl p-8 text-center">
      <h1 className="text-3xl">
        {questSpecific ? 'Quest management unavailable' : 'Management unavailable'}
      </h1>
      <p className="mt-4 text-base-content/70">
        {questSpecific
          ? "You don't have access to manage this quest."
          : 'Organizer or Admin access is required to manage quests.'}
      </p>
      <Link className="btn btn-primary mt-6 rounded-full" to="/">
        Back home
      </Link>
    </section>
  );
}

export default function RequireManagementAccess() {
  const auth = useAuthQuery();

  if (auth.isPending) {
    return (
      <section
        aria-live="polite"
        className="mx-auto max-w-6xl space-y-4 px-4 py-8"
      >
        <p className="sr-only">Checking management access…</p>
        <div className="skeleton h-10 w-72" />
        <div className="skeleton h-32 w-full" />
      </section>
    );
  }

  if (!auth.data) {
    return <Navigate replace to="/login" />;
  }

  if (!auth.data.roles.some((role) => role === 'Organizer' || role === 'Admin')) {
    return <ManagementForbidden />;
  }

  return <Outlet />;
}

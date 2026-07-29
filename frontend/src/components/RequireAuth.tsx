import { Navigate, Outlet } from 'react-router-dom';
import { useAuthQuery } from '../hooks/useAuth.ts';

/**
 * Generic authenticated guard with an explicit four-state machine (M3):
 * pending → skeleton; confirmed anonymous → redirect; authenticated →
 * children; session-restore transport failure → bounded inline error with
 * Retry. A transport failure is not evidence of anonymity, so it NEVER
 * redirects. Private Passport/progression fetches therefore fire only in
 * the authenticated state.
 */
export default function RequireAuth() {
  const auth = useAuthQuery();

  if (auth.isPending) {
    return (
      <section
        aria-live="polite"
        className="mx-auto max-w-4xl space-y-4 px-4 py-8"
      >
        <p className="sr-only">Checking your session…</p>
        <div className="skeleton h-10 w-72" />
        <div className="skeleton h-32 w-full" />
      </section>
    );
  }

  if (auth.isError) {
    return (
      <section className="kiwi-panel mx-auto my-16 max-w-2xl p-8 text-center">
        <h1 className="text-3xl">We could not restore your session</h1>
        <p className="mt-4 text-muted-content" role="alert">
          Check your connection and try again.
        </p>
        <button
          className="btn btn-primary mt-6 rounded-full"
          onClick={() => void auth.refetch()}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!auth.data) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

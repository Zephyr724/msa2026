import { Leaf, LogOut } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthQuery, useLogoutMutation } from '../hooks/useAuth.ts';

export default function AppShell() {
  const auth = useAuthQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      navigate('/');
    } catch {
      // The mutation error is rendered next to the navigation action.
    }
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100">
        <nav
          aria-label="Primary navigation"
          className="navbar mx-auto max-w-6xl gap-2 px-4"
        >
          <Link
            aria-label="Kiwimpact home"
            className="btn btn-ghost gap-2 px-2 text-xl"
            to="/"
          >
            <Leaf aria-hidden="true" className="size-6 text-success" />
            <span className="hidden sm:inline">Kiwimpact</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link className="btn btn-ghost btn-sm" to="/quests">
              Quests
            </Link>
            {auth.isPending ? (
              <span aria-live="polite" className="text-sm text-base-content/60">
                Checking session…
              </span>
            ) : auth.data ? (
              <>
                <span className="hidden text-sm sm:inline">
                  {auth.data.displayName}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={logout.isPending}
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  {logout.isPending ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" to="/login">
                  Sign in
                </Link>
                <Link
                  aria-label="Create account"
                  className="btn btn-success btn-sm"
                  to="/register"
                >
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Create account</span>
                </Link>
              </>
            )}
          </div>
        </nav>
        {auth.isError && (
          <p
            className="mx-auto max-w-6xl px-4 pb-3 text-sm text-error"
            role="status"
          >
            We could not restore your session. You can still browse public quests.
          </p>
        )}
        {logout.isError && (
          <p
            className="mx-auto max-w-6xl px-4 pb-3 text-sm text-error"
            role="alert"
          >
            Sign out failed. Please try again.
          </p>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

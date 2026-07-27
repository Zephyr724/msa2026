import {
  ClipboardList,
  Compass,
  IdCard,
  LogIn,
  LogOut,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import BrandMark from '../components/BrandMark.tsx';
import PlayerStatusCapsule from '../components/PlayerStatusCapsule.tsx';
import ThemeSwitcher from '../components/ThemeSwitcher.tsx';
import { useAuthQuery, useLogoutMutation } from '../hooks/useAuth.ts';
import { useThemeSync } from '../hooks/useThemeSync.ts';

interface NavigationItem {
  label: string;
  to: string;
  Icon: LucideIcon;
}

const publicNavigation: NavigationItem[] = [
  { label: 'Discover', to: '/quests', Icon: Compass },
  { label: 'Leaderboard', to: '/leaderboard', Icon: Trophy },
];

const memberNavigation: NavigationItem[] = [
  { label: 'Discover', to: '/quests', Icon: Compass },
  { label: 'My Quests', to: '/my-quests', Icon: Target },
  { label: 'Passport', to: '/passport', Icon: IdCard },
  { label: 'Leaderboard', to: '/leaderboard', Icon: Trophy },
];

export default function AppShell() {
  useThemeSync();
  const auth = useAuthQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const canManageQuests = auth.data?.roles.some(
    (role) => role === 'Organizer' || role === 'Admin',
  );
  const isAdmin = auth.data?.roles.includes('Admin');
  const navigation = auth.data ? memberNavigation : publicNavigation;

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      navigate('/');
    } catch {
      // The mutation error is rendered beneath the header.
    }
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <a
        className="sr-only z-[100] rounded-lg bg-base-100 px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-base-300/85 bg-base-200/92 backdrop-blur-xl">
        <nav
          aria-label="Primary navigation"
          className="kiwi-page flex h-16 items-center gap-3"
        >
          <BrandMark />

          <div className="mx-auto hidden items-center gap-1 md:flex">
            {navigation.map(({ label, to, Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/65 hover:bg-secondary hover:text-base-content'
                  }`
                }
                key={to}
                to={to}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            ))}
            {!auth.data && (
              <Link
                className="rounded-full px-4 py-2 text-sm font-semibold text-base-content/65 transition-colors hover:bg-secondary hover:text-base-content"
                to="/#how-it-works"
              >
                How it works
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {auth.data && <PlayerStatusCapsule />}
            <ThemeSwitcher />

            {auth.isPending ? (
              <span aria-live="polite" className="hidden text-xs text-base-content/55 sm:inline">
                Checking session…
              </span>
            ) : auth.data ? (
              <>
                {canManageQuests && (
                  <NavLink
                    aria-label="Manage quests"
                    className={({ isActive }) =>
                      `btn btn-ghost btn-sm btn-square xl:w-auto xl:gap-2 xl:px-3 ${
                        isActive ? 'btn-active' : ''
                      }`
                    }
                    to="/organizer/quests"
                  >
                    <ClipboardList aria-hidden="true" className="size-4" />
                    <span className="hidden xl:inline">Manage</span>
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink className="btn btn-ghost btn-sm" to="/admin/reviews">
                    Review
                  </NavLink>
                )}
                <span
                  className="hidden max-w-28 truncate text-sm font-semibold sm:inline"
                  title={auth.data.displayName}
                >
                  {auth.data.displayName}
                </span>
                <button
                  aria-label="Sign out"
                  className="btn btn-ghost btn-sm btn-square"
                  disabled={logout.isPending}
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  aria-label="Sign in"
                  className="btn btn-ghost btn-sm hidden gap-2 sm:inline-flex"
                  to="/login"
                >
                  <LogIn aria-hidden="true" className="size-4" />
                  Sign in
                </Link>
                <Link className="btn btn-primary btn-sm rounded-full px-4" to="/register">
                  Join free
                </Link>
              </>
            )}
          </div>
        </nav>

        {(auth.isError || logout.isError) && (
          <div className="border-t border-error/20 bg-error/10">
            <p
              className="kiwi-page py-2 text-sm text-error"
              role={logout.isError ? 'alert' : 'status'}
            >
              {logout.isError
                ? 'Sign out failed. Please try again.'
                : 'We could not restore your session. You can still browse public quests.'}
            </p>
          </div>
        )}
      </header>

      <main
        className={!auth.isPending ? 'pb-20 md:pb-0' : undefined}
        id="main-content"
      >
        <Outlet />
      </main>

      {!auth.isPending && (
        <nav
          aria-label={auth.data ? 'Member navigation' : 'Public navigation'}
          className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-base-300 bg-base-100/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_35px_rgba(24,48,38,0.08)] backdrop-blur-xl md:hidden ${
            auth.data ? 'grid-cols-4' : 'grid-cols-2'
          }`}
        >
          {navigation.map(({ label, to, Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[0.65rem] font-bold ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-base-content/55'
                }`
              }
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

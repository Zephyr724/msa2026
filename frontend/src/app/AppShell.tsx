import {
  ClipboardList,
  Compass,
  FlaskConical,
  IdCard,
  LogIn,
  LogOut,
  MessagesSquare,
  ShieldCheck,
  Target,
  Trophy,
  UserRoundCog,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import BrandMark from '../components/BrandMark.tsx';
import PlayerStatusCapsule, {
  RewardPreviewStatusCapsule,
} from '../components/PlayerStatusCapsule.tsx';
import ThemeSwitcher from '../components/ThemeSwitcher.tsx';
import { useAuthQuery, useLogoutMutation } from '../hooks/useAuth.ts';
import { useGlobalClickSound } from '../hooks/useGlobalClickSound.ts';
import { playUiSound, setSoundMuted, useSoundMuted } from '../lib/uiSounds.ts';
import { useThemeSync } from '../hooks/useThemeSync.ts';
import { useMyAchievementProfile } from '../hooks/useAchievements.ts';
import { TrophyArtwork } from '../components/game/GameArtwork.tsx';
import RewardFeedbackProvider from '../components/reward/RewardFeedbackProvider.tsx';
import RewardInboxDelivery from '../components/reward/RewardInboxDelivery.tsx';

interface NavigationItem {
  label: string;
  to: string;
  Icon: LucideIcon;
}

const publicNavigation: NavigationItem[] = [
  { label: 'Discover', to: '/quests', Icon: Compass },
  { label: 'Community', to: '/community', Icon: MessagesSquare },
  { label: 'Leaderboard', to: '/leaderboard', Icon: Trophy },
];

const memberNavigation: NavigationItem[] = [
  { label: 'Discover', to: '/quests', Icon: Compass },
  { label: 'Community', to: '/community', Icon: MessagesSquare },
  { label: 'My Quests', to: '/my-quests', Icon: Target },
  { label: 'Passport', to: '/passport', Icon: IdCard },
  { label: 'Leaderboard', to: '/leaderboard', Icon: Trophy },
];

export default function AppShell() {
  useThemeSync();
  const auth = useAuthQuery();
  return (
    <RewardFeedbackProvider key={auth.data?.userId ?? 'guest'}>
      <ScrollRestoration />
      <RewardInboxDelivery />
      <AppShellContent />
    </RewardFeedbackProvider>
  );
}

function AppShellContent() {
  useGlobalClickSound();
  const auth = useAuthQuery();
  const logout = useLogoutMutation();
  const location = useLocation();
  const navigate = useNavigate();
  const canManageQuests = auth.data?.roles.some(
    (role) => role === 'Organizer' || role === 'Admin',
  );
  const isAdmin = auth.data?.roles.includes('Admin');
  const navigation = auth.data ? memberNavigation : publicNavigation;
  const isRewardLab = import.meta.env.DEV && location.pathname === '/dev/rewards';

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

      <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/90 backdrop-blur-xl">
        <nav
          aria-label="Primary navigation"
          className="kiwi-page flex h-16 items-center gap-3"
        >
          <BrandMark />

          <div className="mx-auto hidden items-center gap-1 md:flex">
            {navigation.map(({ label, to, Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `kiwi-primary-nav-item inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 font-semibold transition-colors lg:px-4 ${
                    isActive
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-muted-content hover:bg-secondary hover:text-base-content'
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
                className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-muted-content transition-colors hover:bg-secondary hover:text-base-content lg:px-4 lg:text-sm"
                to="/#how-it-works"
              >
                How it works
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {auth.data
              ? <PlayerStatusCapsule />
              : isRewardLab && <RewardPreviewStatusCapsule />}
            {import.meta.env.DEV && (
              <NavLink
                aria-label="Open Reward Lab"
                className={({ isActive }) =>
                  `btn btn-ghost btn-sm btn-square hidden sm:inline-flex ${isActive ? 'btn-active' : ''}`
                }
                title="Reward Lab"
                to="/dev/rewards"
              >
                <FlaskConical aria-hidden="true" className="size-4" />
              </NavLink>
            )}
            <ThemeSwitcher />
            <SoundToggle />

            {auth.isPending ? (
              <span aria-live="polite" className="hidden text-xs text-muted-content sm:inline">
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
                  <NavLink
                    aria-label="Review evidence"
                    className={({ isActive }) =>
                      `btn btn-ghost btn-sm btn-square sm:w-auto sm:gap-2 sm:px-3 ${
                        isActive ? 'btn-active' : ''
                      }`
                    }
                    to="/admin/reviews"
                  >
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Review</span>
                  </NavLink>
                )}
                <span
                  className="hidden"
                >
                  Signed in as {auth.data.displayName}
                </span>
                <Link
                  aria-label="Profile settings"
                  className="btn btn-ghost btn-sm btn-square sm:w-auto sm:gap-2 sm:px-3"
                  title={`Profile settings for ${auth.data.displayName}`}
                  to="/settings/profile"
                >
                  <UserRoundCog aria-hidden="true" className="size-4" />
                  <NavAchievementTrophy />
                  <span className="hidden sm:inline">{auth.data.displayName}</span>
                </Link>
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
                <Link
                  className={`btn btn-primary btn-sm rounded-full px-4 ${
                    isRewardLab ? 'hidden sm:inline-flex' : ''
                  }`}
                  to="/register"
                >
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
          className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-base-300 bg-base-100 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-12px_35px_rgba(24,48,38,0.08)] md:hidden ${
            auth.data ? 'grid-cols-5' : 'grid-cols-3'
          }`}
        >
          {navigation.map(({ label, to, Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[0.65rem] font-bold ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-content'
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

function SoundToggle() {
  const muted = useSoundMuted();
  const label = muted ? 'Unmute interface sounds' : 'Mute interface sounds';
  return (
    <button
      aria-label={label}
      aria-pressed={muted}
      className="btn btn-ghost btn-sm btn-square"
      data-no-click-sound
      onClick={() => {
        const nextMuted = !muted;
        setSoundMuted(nextMuted);
        if (!nextMuted) playUiSound('click');
      }}
      title={label}
      type="button"
    >
      {muted
        ? <VolumeX aria-hidden="true" className="size-4" />
        : <Volume2 aria-hidden="true" className="size-4" />}
    </button>
  );
}

function NavAchievementTrophy() {
  const profile = useMyAchievementProfile();
  if (!profile.data || profile.data.trophy.tier === 'Locked')
    return null;

  const { trophy } = profile.data;
  const percentage = trophy.nationwideEarnedCount > 0
      && trophy.earnedPercentage < 0.01
    ? '<0.01%'
    : `${trophy.earnedPercentage.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}%`;

  return (
    <span
      aria-hidden="true"
      className="hidden sm:grid"
      data-nav-trophy={trophy.tier}
      title={`${trophy.tier} Trophy · ${trophy.nationwideEarnedCount.toLocaleString()} nationwide · ${percentage} · ${trophy.rarity}`}
    >
      <TrophyArtwork tier={trophy.tier} size={22} />
    </span>
  );
}

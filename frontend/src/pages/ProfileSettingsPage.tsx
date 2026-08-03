import {
  CheckCircle2, KeyRound, Link2, MapPinned, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CommunityProfileCard from '../components/community/CommunityProfileCard.tsx';
import { useAuthQuery } from '../hooks/useAuth.ts';
import { beginGoogleLink } from '../lib/api/auth.ts';

export default function ProfileSettingsPage() {
  const auth = useAuthQuery();
  const [searchParams] = useSearchParams();
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const googleLinked = auth.data?.linkedProviders?.includes('Google') ?? false;

  async function handleGoogleLink() {
    setIsLinking(true);
    setLinkError(null);
    try {
      window.location.assign(await beginGoogleLink());
    } catch {
      setLinkError('Google linking could not be started. Please try again.');
      setIsLinking(false);
    }
  }

  const callbackError = googleLinkErrorMessage(searchParams.get('googleError'));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-base-200 py-8">
      <main className="kiwi-page max-w-4xl">
        <header>
          <p className="kiwi-stat-label">Your account</p>
          <h1 className="mt-1 kiwi-page-heading">Profile Settings</h1>
          <p className="kiwi-page-intro mt-1 max-w-2xl">
            Manage your Home Community, Passport visibility, and account safety.
          </p>
        </header>

        <section
          aria-labelledby="community-settings-heading"
          className="mt-7"
          id="community"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPinned aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="kiwi-stat-label">Community identity</p>
              <h2 className="mt-1 text-2xl" id="community-settings-heading">Community</h2>
              <p className="mt-1 text-sm text-muted-content">
                This is the single place to change your Home Community.
                Leaderboard scope controls only change what you are viewing.
              </p>
            </div>
          </div>
          <CommunityProfileCard />
        </section>

        <section className="kiwi-panel mt-7 p-5" aria-labelledby="account-safety-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="kiwi-stat-label">Account safety</p>
              <h2 className="mt-1 text-xl" id="account-safety-heading">Sign-in methods</h2>
              <p className="mt-1 text-sm text-muted-content">
                Manage the secure ways you can access this account.
              </p>
            </div>
          </div>
          {searchParams.get('googleLinked') === '1' && (
            <div className="alert alert-success mt-4 rounded-2xl" role="status">
              <CheckCircle2 aria-hidden="true" className="size-5" />
              Google is linked to your account.
            </div>
          )}
          {(linkError || callbackError) && (
            <div className="alert alert-error mt-4 rounded-2xl" role="alert">
              {linkError ?? callbackError}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {auth.data?.hasPassword !== false && (
              <Link className="btn btn-outline justify-start" to="/settings/password">
                <KeyRound aria-hidden="true" className="size-4" />
                Change password
              </Link>
            )}
            <button
              className="btn btn-outline justify-start"
              disabled={googleLinked || isLinking}
              onClick={() => void handleGoogleLink()}
              type="button"
            >
              {googleLinked ? (
                <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
              ) : (
                <Link2 aria-hidden="true" className="size-4" />
              )}
              {googleLinked ? 'Google linked' : isLinking ? 'Connecting…' : 'Link Google account'}
            </button>
          </div>
          {auth.data?.hasPassword === false && (
            <p className="mt-3 text-sm text-muted-content">
              This account currently signs in with Google and has no local password.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function googleLinkErrorMessage(error: string | null): string | null {
  switch (error) {
    case 'already_linked':
      return 'That Google account is already linked to another Kiwimpact account.';
    case 'provider':
    case 'unavailable':
      return 'Google linking could not be completed. Please try again.';
    default:
      return null;
  }
}

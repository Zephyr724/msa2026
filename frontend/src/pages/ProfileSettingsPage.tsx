import { KeyRound, MapPinned, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommunityProfileCard from '../components/community/CommunityProfileCard.tsx';

export default function ProfileSettingsPage() {
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
              <h2 className="mt-1 text-xl" id="account-safety-heading">Password</h2>
              <p className="mt-1 text-sm text-muted-content">
                Update the password used to sign in to this account.
              </p>
            </div>
            <Link className="btn btn-outline btn-sm" to="/settings/password">
              <KeyRound aria-hidden="true" className="size-4" />
              Change password
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../hooks/useAuth.ts';
import { ApiError } from '../lib/api/apiFetch.ts';
import { Award, CheckCircle2, IdCard, Leaf, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const login = useLoginMutation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!email.trim() || !password) {
      setValidationError('Enter your email and password.');
      return;
    }

    try {
      await login.mutateAsync({ email: email.trim(), password });
      navigate('/');
    } catch {
      // The mutation error is rendered below.
    }
  }

  const errorMessage = login.error instanceof ApiError && login.error.status === 429
    ? 'Too many sign-in attempts. Please wait and try again.'
    : login.isError
      ? 'The email or password is incorrect.'
      : null;

  return (
    <AuthCard title="Welcome back" intro="Sign in to continue your impact journey.">
      {searchParams.get('registered') === '1' && (
        <div className="alert alert-success rounded-2xl" role="status">
          Account created. You can sign in now.
        </div>
      )}
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <label className="form-control block">
          <span className="mb-2 block text-sm font-bold">Email</span>
          <input
            autoComplete="email"
            className="input input-bordered h-12 w-full rounded-2xl"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
        <label className="form-control block">
          <span className="mb-2 block text-sm font-bold">Password</span>
          <input
            autoComplete="current-password"
            className="input input-bordered h-12 w-full rounded-2xl"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        {(validationError || errorMessage) && (
          <div className="alert alert-error rounded-2xl" role="alert">
            {validationError ?? errorMessage}
          </div>
        )}
        <button
          className="btn btn-primary h-12 w-full rounded-2xl"
          disabled={login.isPending}
          type="submit"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
        <Link className="link link-primary block text-right text-sm font-bold" to="/forgot-password">
          Forgot password?
        </Link>
      </form>
      <p className="text-center text-sm">
        New to Kiwimpact?{' '}
        <Link className="link link-primary font-bold" to="/register">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

interface AuthCardProps {
  title: string;
  intro: string;
  children: React.ReactNode;
}

export function AuthCard({ title, intro, children }: AuthCardProps) {
  return (
    <div className="kiwi-topography min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-content lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 kiwi-topography opacity-60" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary-content/20 bg-primary-content/12">
              <Leaf aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-8 text-4xl">Local action becomes visible progress.</h2>
            <p className="mt-4 leading-relaxed text-primary-content/75">
              Join verified eco quests, earn XP, and keep your participation in
              a Personal Impact Passport.
            </p>
          </div>
          <div className="relative grid gap-3">
            {[
              [CheckCircle2, 'Verified quest history'],
              [Zap, 'Server-authoritative XP'],
              [Award, 'Achievement milestones'],
              [IdCard, 'Your Impact Passport'],
            ].map(([Icon, label]) => {
              const FeatureIcon = Icon as typeof Leaf;
              return (
                <div className="flex items-center gap-3 rounded-2xl border border-primary-content/15 bg-primary-content/10 p-3" key={String(label)}>
                  <FeatureIcon aria-hidden="true" className="size-4" />
                  <span className="text-sm font-semibold">{String(label)}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="p-6 sm:p-10 lg:p-12">
          <p className="kiwi-stat-label">Kiwimpact member access</p>
          <h1 className="mt-2 text-4xl">{title}</h1>
          <p className="mt-2 text-muted-content">{intro}</p>
          <div className="mt-7 space-y-5">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

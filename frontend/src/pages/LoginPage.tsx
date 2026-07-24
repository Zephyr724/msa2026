import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../hooks/useAuth.ts';
import { ApiError } from '../lib/api/apiFetch.ts';

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
        <div className="alert alert-success" role="status">
          Account created. You can sign in now.
        </div>
      )}
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <label className="form-control block">
          <span className="label-text mb-1 block">Email</span>
          <input
            autoComplete="email"
            className="input input-bordered w-full"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
        <label className="form-control block">
          <span className="label-text mb-1 block">Password</span>
          <input
            autoComplete="current-password"
            className="input input-bordered w-full"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        {(validationError || errorMessage) && (
          <div className="alert alert-error" role="alert">
            {validationError ?? errorMessage}
          </div>
        )}
        <button
          className="btn btn-success w-full"
          disabled={login.isPending}
          type="submit"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-sm">
        New to Kiwimpact?{' '}
        <Link className="link link-success" to="/register">
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <section className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-5">
          <div>
            <h1 className="card-title text-2xl">{title}</h1>
            <p className="mt-1 text-base-content/70">{intro}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}

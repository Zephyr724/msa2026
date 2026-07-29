import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../hooks/useAuth.ts';
import { ApiError } from '../lib/api/apiFetch.ts';
import { AuthCard } from './LoginPage.tsx';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const register = useRegisterMutation();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!displayName.trim() || !email.trim() || !password || !passwordConfirmation) {
      setValidationError('Complete every field.');
      return;
    }
    if (displayName.trim().length > 100) {
      setValidationError('Display name must be 100 characters or fewer.');
      return;
    }
    if (password.length < 12) {
      setValidationError('Password must be at least 12 characters.');
      return;
    }
    if (password !== passwordConfirmation) {
      setValidationError('Passwords must match.');
      return;
    }

    try {
      await register.mutateAsync({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation,
      });
      navigate(`/check-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      // The mutation error is rendered below.
    }
  }

  const errorMessage = register.error instanceof ApiError && register.error.status === 429
    ? 'Too many account requests. Please wait and try again.'
    : register.isError
      ? 'We could not create the account. Check the details and try again.'
      : null;

  return (
    <AuthCard title="Create your account" intro="Join local eco quests and track your impact.">
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <label className="form-control block">
          <span className="mb-2 block text-sm font-bold">Display name</span>
          <input
            autoComplete="name"
            className="input input-bordered h-12 w-full rounded-2xl"
            maxLength={100}
            onChange={(event) => setDisplayName(event.target.value)}
            value={displayName}
          />
        </label>
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
            aria-describedby="password-guidance"
            autoComplete="new-password"
            className="input input-bordered h-12 w-full rounded-2xl"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          <span id="password-guidance" className="mt-1 text-xs text-muted-content">
            Use at least 12 characters with upper and lowercase letters, a number,
            and a symbol.
          </span>
        </label>
        <label className="form-control block">
          <span className="mb-2 block text-sm font-bold">Confirm password</span>
          <input
            autoComplete="new-password"
            className="input input-bordered h-12 w-full rounded-2xl"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            type="password"
            value={passwordConfirmation}
          />
        </label>
        {(validationError || errorMessage) && (
          <div className="alert alert-error rounded-2xl" role="alert">
            {validationError ?? errorMessage}
          </div>
        )}
        <button
          className="btn btn-primary h-12 w-full rounded-2xl"
          disabled={register.isPending}
          type="submit"
        >
          {register.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link className="link link-primary font-bold" to="/login">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

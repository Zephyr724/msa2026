import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthCard } from './LoginPage';
import {
  changePassword, confirmEmail, forgotPassword, resendConfirmation, resetPassword,
} from '../lib/api/auth';
import { ApiError } from '../lib/api/apiFetch';

function messageFor(error: unknown): string {
  return error instanceof ApiError
    ? error.problem?.detail ?? 'The request could not be completed.'
    : 'The request could not be completed.';
}

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  useEffect(() => {
    const userId = params.get('userId');
    const token = params.get('token');
    if (!userId || !token) {
      setState('error');
      return;
    }
    void confirmEmail(userId, token)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [params]);
  return (
    <AuthCard title="Confirm your email" intro="Secure your Kiwimpact account.">
      {state === 'pending' && <p aria-live="polite">Checking your confirmation link…</p>}
      {state === 'success' && <div className="alert alert-success">Email confirmed.</div>}
      {state === 'error' && <div className="alert alert-error">This link is invalid or expired.</div>}
      <Link className="btn btn-primary w-full" to="/login">Continue to sign in</Link>
    </AuthCard>
  );
}

export function CheckEmailPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      setMessage((await resendConfirmation(email)).message);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthCard title="Check your email" intro="Use the confirmation link before signing in.">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <input aria-label="Email" className="input input-bordered w-full" onChange={(e) => setEmail(e.target.value)}
          required type="email" value={email} />
        {message && <div className="alert alert-info" role="status">{message}</div>}
        <button className="btn btn-primary w-full" disabled={pending} type="submit">
          {pending ? 'Sending…' : 'Resend confirmation'}
        </button>
      </form>
      <Link className="link link-primary block text-center" to="/login">Back to sign in</Link>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { setMessage((await forgotPassword(email)).message); }
    catch (error) { setMessage(messageFor(error)); }
  }
  return (
    <AuthCard title="Reset your password" intro="We’ll send a private reset link if the account is eligible.">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <input aria-label="Email" className="input input-bordered w-full" onChange={(e) => setEmail(e.target.value)}
          required type="email" value={email} />
        {message && <div className="alert alert-info" role="status">{message}</div>}
        <button className="btn btn-primary w-full" type="submit">Send reset link</button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setMessage('Passwords must match.'); return; }
    try {
      setMessage((await resetPassword(
        params.get('email') ?? '', params.get('token') ?? '',
        password, confirmation,
      )).message);
    } catch (error) { setMessage(messageFor(error)); }
  }
  return (
    <AuthCard title="Choose a new password" intro="Reset links expire after 45 minutes.">
      <PasswordForm password={password} confirmation={confirmation}
        onPassword={setPassword} onConfirmation={setConfirmation} onSubmit={submit}
        submitLabel="Reset password" />
      {message && <div className="alert alert-info" role="status">{message}</div>}
    </AuthCard>
  );
}

export function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { setMessage((await changePassword(current, password, confirmation)).message); }
    catch (error) { setMessage(messageFor(error)); }
  }
  return (
    <main className="kiwi-page py-12">
      <section className="kiwi-panel mx-auto max-w-xl p-7">
        <p className="kiwi-stat-label">Account safety</p>
        <h1 className="mt-2 text-3xl">Change password</h1>
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <input aria-label="Current password" autoComplete="current-password"
            className="input input-bordered w-full" onChange={(e) => setCurrent(e.target.value)}
            required type="password" value={current} />
          <PasswordFields password={password} confirmation={confirmation}
            onPassword={setPassword} onConfirmation={setConfirmation} />
          {message && <div className="alert alert-info" role="status">{message}</div>}
          <button className="btn btn-primary w-full" type="submit">Change password</button>
        </form>
      </section>
    </main>
  );
}

function PasswordForm(props: {
  password: string; confirmation: string; onPassword: (v: string) => void;
  onConfirmation: (v: string) => void; onSubmit: (e: FormEvent) => void; submitLabel: string;
}) {
  return <form className="space-y-4" onSubmit={props.onSubmit}>
    <PasswordFields {...props} />
    <button className="btn btn-primary w-full" type="submit">{props.submitLabel}</button>
  </form>;
}

function PasswordFields({ password, confirmation, onPassword, onConfirmation }: {
  password: string; confirmation: string; onPassword: (v: string) => void;
  onConfirmation: (v: string) => void;
}) {
  return <>
    <input aria-label="New password" autoComplete="new-password" className="input input-bordered w-full"
      minLength={12} onChange={(e) => onPassword(e.target.value)} required type="password" value={password} />
    <input aria-label="Confirm new password" autoComplete="new-password" className="input input-bordered w-full"
      minLength={12} onChange={(e) => onConfirmation(e.target.value)} required type="password" value={confirmation} />
  </>;
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { loginSchema } from '@contour/shared';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../state/auth';
import { ApiError } from '../../services/api/client';

interface LocationState {
  from?: { pathname: string };
}

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as 'email' | 'password';
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await login(result.data.email, result.data.password);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/workspaces', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.code === 'VALIDATION_ERROR')) {
        setFormError('Incorrect email or password.');
      } else if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setFormError('Could not reach the server. Check your connection and try again.');
      } else {
        setFormError('Something went wrong logging you in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <h1 className="text-center font-display text-display-sm text-primary">Welcome back</h1>
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-body text-danger"
        >
          {formError}
        </p>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        required
      />
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Log in
      </Button>
      <p className="text-center text-meta text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-trail underline underline-offset-2">
          Register
        </Link>
      </p>
    </form>
  );
}

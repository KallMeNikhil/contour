import { useState } from 'react';
import type { FormEvent } from 'react';
import { registerSchema } from '@contour/shared';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../state/auth';
import { ApiError } from '../../services/api/client';

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as 'name' | 'email' | 'password';
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(result.data.name, result.data.email, result.data.password);
      navigate('/workspaces', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError('An account with that email already exists.');
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setFormError(err.message);
      } else if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setFormError('Could not reach the server. Check your connection and try again.');
      } else {
        setFormError('Something went wrong creating your account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <h1 className="text-center font-display text-display-sm text-primary">Create your account</h1>
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-body text-danger"
        >
          {formError}
        </p>
      )}
      <Input
        label="Name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        required
      />
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
        autoComplete="new-password"
        helperText={!fieldErrors.password ? 'At least 8 characters.' : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        required
      />
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Register
      </Button>
      <p className="text-center text-meta text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-trail underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}

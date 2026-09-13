import { LoginForm } from '../features/auth/LoginForm';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../state/auth';
import { useEffect } from 'react';

export function LoginPage() {
  const { sessionExpired, clearSessionExpired } = useAuth();

  useEffect(() => () => clearSessionExpired(), [clearSessionExpired]);

  return (
    <AuthShell>
      {sessionExpired && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-body text-warning"
        >
          Your session expired. Please log in again.
        </p>
      )}
      <LoginForm />
    </AuthShell>
  );
}

import { RegisterForm } from '../features/auth/RegisterForm';
import { AuthShell } from '../components/AuthShell';

export function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  it('shows field-level validation errors instead of submitting when the form is empty', async () => {
    renderWithProviders(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/valid email is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits normalized credentials and surfaces a friendly message on 401', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' } }),
    });

    renderWithProviders(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'person@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correcthorsebattery');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
  });
});

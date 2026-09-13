import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('rejects a password shorter than 8 characters before hitting the network', async () => {
    renderWithProviders(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires a name', async () => {
    renderWithProviders(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'longenoughpassword');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

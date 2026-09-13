import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders } from '../test/renderWithProviders';

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login screen</div>} />
      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <div>Workspaces screen</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated visitor to /login', () => {
    localStorage.clear();
    renderWithProviders(<TestApp />, { route: '/workspaces' });
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });
});

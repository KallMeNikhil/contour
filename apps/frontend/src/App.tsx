import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './state/queryClient';
import { AuthProvider, useAuth } from './state/auth';
import { ToastProvider } from './state/toast';
import { AnnouncerProvider } from './state/announcer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceBoardsPage } from './pages/WorkspaceBoardsPage';
import { BoardPage } from './pages/BoardPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/workspaces' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/workspaces"
        element={
          <ProtectedRoute>
            <WorkspacesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspaces/:workspaceId"
        element={
          <ProtectedRoute>
            <WorkspaceBoardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspaces/:workspaceId/boards/:boardId"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invites/:workspaceId/:token"
        element={
          <ProtectedRoute>
            <AcceptInvitePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AnnouncerProvider>
              <AppRoutes />
            </AnnouncerProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

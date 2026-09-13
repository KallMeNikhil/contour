import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { SkeletonBlock } from '../components/SkeletonBlock';
import * as workspacesApi from '../services/api/workspaces';
import { ApiError } from '../services/api/client';
import { useToast } from '../state/toast';

export function AcceptInvitePage() {
  const { workspaceId, token } = useParams<{ workspaceId: string; token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('Could not accept this invite.');

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId || !token) {
      setStatus('error');
      setErrorMessage('This invite link is incomplete.');
      return;
    }
    workspacesApi
      .acceptInvite(workspaceId, token)
      .then(() => {
        if (cancelled) return;
        showToast("You've joined the workspace.", { tone: 'success' });
        navigate(`/workspaces/${workspaceId}`, { replace: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : 'Could not accept this invite.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, token, navigate, showToast]);

  if (!workspaceId || !token) {
    return <Navigate to="/workspaces" replace />;
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-full max-w-[480px] flex-col items-center justify-center gap-4 px-4 py-8">
        {status === 'pending' && (
          <>
            <SkeletonBlock className="h-6 w-48" />
            <p className="text-body text-secondary">Accepting your invite…</p>
          </>
        )}
        {status === 'error' && (
          <EmptyState
            title="Couldn't accept this invite"
            description={errorMessage}
            action={{ label: 'Back to workspaces', onClick: () => navigate('/workspaces') }}
          />
        )}
      </div>
    </AppShell>
  );
}

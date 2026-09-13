import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { NeutralChip } from '../components/Chip';
import { CreateWorkspaceModal } from '../features/workspace/CreateWorkspaceModal';
import { useCreateWorkspace, useWorkspaces } from '../features/workspace/hooks';

const ACCENT_RING = [
  'var(--label-slate)',
  'var(--label-clay)',
  'var(--label-moss)',
  'var(--label-ochre)',
  'var(--label-plum)',
  'var(--label-stone)',
];

function ringColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENT_RING[hash % ACCENT_RING.length];
}

function formatJoined(dateIso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(
    new Date(dateIso),
  );
}

export function WorkspacesPage() {
  const { data: workspaces, isLoading, isError, refetch } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="bg-contour-canvas h-full overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col justify-center px-6 py-14 sm:px-10">
          <div className="flex flex-col gap-6 border-b border-border-default pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-micro uppercase text-muted">
                {workspaces && workspaces.length > 0
                  ? `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}`
                  : 'Get started'}
              </p>
              <h1 className="mt-1.5 font-display text-display-xl text-primary">Workspaces</h1>
              <p className="mt-2.5 text-body text-secondary">
                Every team and project you're part of, in one place. <br/> Open one to see its boards, or
                start something new.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-accent px-4 py-2.5 text-body-medium text-accent-foreground shadow-xs transition-all duration-micro ease-settle hover:-translate-y-px hover:bg-accent-hover hover:shadow-sm sm:self-auto"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New workspace
            </button>
          </div>

          <section className="mt-8 rounded-2xl border border-border-default bg-surface/60 p-6 shadow-xs backdrop-blur-sm sm:p-8">
            {!isLoading && !isError && workspaces && workspaces.length > 0 && (
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-body-medium font-semibold text-primary">Your workspaces</h2>
                <span className="font-data text-data text-muted">
                  {workspaces.length} total
                </span>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonBlock className="h-40 rounded-xl" />
                <SkeletonBlock className="h-40 rounded-xl" />
                <SkeletonBlock className="h-40 rounded-xl" />
              </div>
            )}

            {isError && (
              <ErrorState description="Couldn't load your workspaces." onRetry={() => refetch()} />
            )}

            {!isLoading && !isError && workspaces?.length === 0 && (
              <EmptyState
                title="No workspaces yet"
                description="Create a workspace to start organizing boards for your team."
                action={{ label: 'New workspace', onClick: () => setIsCreateOpen(true) }}
              />
            )}

            {!isLoading && !isError && workspaces && workspaces.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => navigate(`/workspaces/${ws._id}`)}
                    className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border border-border-default bg-surface p-6 text-left shadow-xs transition-all duration-micro ease-settle hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover hover:shadow-md"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1 transition-[width] duration-micro ease-settle group-hover:w-1.5"
                      style={{ backgroundColor: ringColorFor(ws._id) }}
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <span className="font-display text-display-sm leading-tight text-primary">
                        {ws.name}
                      </span>
                      <NeutralChip>{ws.role}</NeutralChip>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-default pl-2 pt-4">
                      <span className="font-data text-data text-muted">
                        Created {formatJoined(ws.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-meta font-medium text-secondary transition-colors group-hover:text-trail">
                        Open
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-micro group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (name) => {
          const ws = await createWorkspace.mutateAsync(name);
          setIsCreateOpen(false);
          navigate(`/workspaces/${ws._id}`);
        }}
      />
    </AppShell>
  );
}

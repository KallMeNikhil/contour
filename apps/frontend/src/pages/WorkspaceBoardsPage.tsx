import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { EmptyState, ErrorState } from '../components/EmptyState';
import { CreateBoardModal } from '../features/workspace/CreateBoardModal';
import { WorkspaceMembersPanel } from '../features/workspace/WorkspaceMembersPanel';
import { useBoards, useCreateBoard, useWorkspace } from '../features/workspace/hooks';

function formatUpdated(dateIso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(dateIso),
  );
}

export function WorkspaceBoardsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    isError: isWorkspaceError,
  } = useWorkspace(workspaceId);
  const { data: boards, isLoading, isError, refetch } = useBoards(workspaceId);
  const createBoard = useCreateBoard(workspaceId as string);

  const canCreate = workspace?.role === 'owner' || workspace?.role === 'editor';

  if (isWorkspaceError) {
    return (
      <AppShell>
        <ErrorState
          fullPage
          title="Couldn't load this workspace"
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell currentWorkspaceId={workspaceId} currentWorkspaceName={workspace?.name}>
      <div className="bg-contour-canvas h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col px-6 py-14 sm:px-10">
          <div className="flex flex-col gap-6 border-b border-border-default pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-micro uppercase text-muted">Workspace</p>
              <h1 className="mt-1.5 font-display text-display-xl text-primary">
                {isWorkspaceLoading ? (
                  <SkeletonBlock className="h-10 w-56" />
                ) : (
                  (workspace?.name ?? 'Boards')
                )}
              </h1>
              <p className="mt-2.5 text-body text-secondary">
                The boards your team is tracking work on here.
              </p>
            </div>
            {canCreate && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-accent px-4 py-2.5 text-body-medium text-accent-foreground shadow-xs transition-all duration-micro ease-settle hover:-translate-y-px hover:bg-accent-hover hover:shadow-sm sm:self-auto"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New board
              </button>
            )}
          </div>

          <section className="mt-8 rounded-2xl border border-border-default/70 bg-surface/60 p-6 shadow-xs backdrop-blur-sm sm:p-8">
            {!isLoading && !isError && boards && boards.length > 0 && (
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-body-medium font-semibold text-primary">Boards</h2>
                <span className="font-data text-data text-muted">{boards.length} total</span>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SkeletonBlock className="h-36 rounded-xl" />
                <SkeletonBlock className="h-36 rounded-xl" />
                <SkeletonBlock className="h-36 rounded-xl" />
              </div>
            )}

            {isError && (
              <ErrorState
                description="Couldn't load boards for this workspace."
                onRetry={() => refetch()}
              />
            )}

            {!isLoading && !isError && boards?.length === 0 && (
              <EmptyState
                title="No boards yet"
                description={
                  canCreate
                    ? 'Create a board to start tracking work in this workspace.'
                    : 'An owner or editor needs to create the first board.'
                }
                action={
                  canCreate
                    ? { label: 'New board', onClick: () => setIsCreateOpen(true) }
                    : undefined
                }
              />
            )}

            {!isLoading && !isError && boards && boards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <button
                    key={board._id}
                    onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board._id}`)}
                    className="group relative flex flex-col gap-5 overflow-hidden rounded-xl border border-border-default bg-surface p-6 text-left shadow-xs transition-all duration-micro ease-settle hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover hover:shadow-md"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1 bg-trail opacity-0 transition-opacity duration-micro group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <span className="truncate font-display text-display-sm leading-tight text-primary">
                      {board.name}
                    </span>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-default pt-4">
                      <span className="font-data text-data text-muted">
                        {board.labels.length > 0
                          ? `${board.labels.length} label${board.labels.length === 1 ? '' : 's'} · updated ${formatUpdated(board.updatedAt)}`
                          : `Updated ${formatUpdated(board.updatedAt)}`}
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

          {workspace && (
            <div className="mt-6 rounded-2xl border border-border-default/70 bg-surface/60 p-6 shadow-xs backdrop-blur-sm sm:p-8">
              <WorkspaceMembersPanel
                workspaceId={workspaceId as string}
                currentUserRole={workspace.role}
                ownerId={workspace.ownerId}
              />
            </div>
          )}
        </div>
      </div>

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (name) => {
          const board = await createBoard.mutateAsync(name);
          setIsCreateOpen(false);
          navigate(`/workspaces/${workspaceId}/boards/${board._id}`);
        }}
      />
    </AppShell>
  );
}

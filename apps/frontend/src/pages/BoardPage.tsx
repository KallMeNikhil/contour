import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragCancelEvent, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { AppShell } from '../components/AppShell';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { ErrorState, EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/Button';
import { Popover } from '../components/Popover';
import { useWorkspace } from '../features/workspace/hooks';
import {
  useBoardFull,
  useCreateColumn,
  useCreateTask,
  useDeleteBoard,
  useDeleteColumn,
  useRenameBoard,
  useRenameColumn,
} from '../features/board/hooks';
import { groupTasksByColumn, sortedColumns } from '../features/board/grouping';
import { BoardHeader } from '../features/board/BoardHeader';
import { ColumnBand } from '../features/board/ColumnBand';
import { SortableColumnBand } from '../features/board/dnd/SortableColumnBand';
import { AddColumnForm } from '../features/board/AddColumnForm';
import { ColumnSwitcher } from '../features/board/ColumnSwitcher';
import { TaskDetailPanel } from '../features/board/TaskDetailPanel';
import { ConfirmDeleteModal } from '../features/board/ConfirmDeleteModal';
import { TaskCard } from '../features/board/TaskCard';
import { useBoardDnd } from '../features/board/dnd/useBoardDnd';
import { useColumnDnd } from '../features/board/dnd/useColumnDnd';
import { useBoardRealtime } from '../features/board/useBoardRealtime';
import { useIsMobileBoard } from '../hooks/useMediaQuery';
import { useAuth } from '../state/auth';
import { useAnnouncer } from '../state/announcer';

export function BoardPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const isMobile = useIsMobileBoard();

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: boardFull, isLoading, isError, refetch } = useBoardFull(boardId as string);
  useBoardRealtime(boardId);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [isDeleteBoardOpen, setIsDeleteBoardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const renameBoard = useRenameBoard(boardId as string);
  const createColumn = useCreateColumn(boardId as string);
  const renameColumn = useRenameColumn(boardId as string);
  const deleteColumn = useDeleteColumn(boardId as string);
  const createTask = useCreateTask(boardId as string);
  const deleteBoard = useDeleteBoard(workspaceId as string, boardId as string);

  const serverColumns = boardFull ? sortedColumns(boardFull.columns) : [];
  const tasksByColumn = boardFull
    ? groupTasksByColumn(boardFull.columns, boardFull.tasks)
    : new Map();

  const canEdit = workspace?.role === 'owner' || workspace?.role === 'editor';
  const canDeleteBoard = canEdit;

  const dnd = useBoardDnd({
    boardId: boardId as string,
    columns: serverColumns,
    tasksByColumn,
    canEdit: !!canEdit,
  });

  const columnDnd = useColumnDnd({
    boardId: boardId as string,
    columns: serverColumns,
    canEdit: !!canEdit,
  });

  const columnLookup = useMemo(
    () => new Map(serverColumns.map((c) => [c._id, c] as const)),
    [serverColumns],
  );
  const columns = isMobile
    ? serverColumns
    : columnDnd.columnOrder
        .map((id) => columnLookup.get(id))
        .filter((c): c is NonNullable<typeof c> => !!c);

  const taskLookup = useMemo(() => {
    const map = new Map(boardFull?.tasks.map((t) => [t._id, t] as const));
    return map;
  }, [boardFull]);

  function orderedTasksForColumn(columnId: string) {
    const ids = dnd.effectiveOrder[columnId] ?? [];
    const resolved = ids
      .map((id) => taskLookup.get(id))
      .filter((t): t is NonNullable<typeof t> => !!t);

    return resolved.length > 0 || ids.length > 0 ? resolved : (tasksByColumn.get(columnId) ?? []);
  }

  function handleDragStart(event: DragStartEvent) {
    dnd.handleDragStart(event);
    columnDnd.handleDragStart(event);
  }
  function handleDragOver(event: DragOverEvent) {
    dnd.handleDragOver(event);
    columnDnd.handleDragOver(event);
  }
  function handleDragEnd(event: DragEndEvent) {
    dnd.handleDragEnd(event);
    columnDnd.handleDragEnd(event);
  }
  function handleDragCancel(event: DragCancelEvent) {
    dnd.handleDragCancel();
    columnDnd.handleDragCancel();
    void event;
  }

  useEffect(() => {
    if (!activeColumnId && serverColumns.length > 0) {
      setActiveColumnId(serverColumns[0]._id);
    }
    if (
      activeColumnId &&
      !serverColumns.some((c) => c._id === activeColumnId) &&
      serverColumns.length > 0
    ) {
      setActiveColumnId(serverColumns[0]._id);
    }
  }, [serverColumns.length]);

  const selectedTask = boardFull?.tasks.find((t) => t._id === selectedTaskId) ?? null;

  if (isError) {
    return (
      <AppShell currentWorkspaceId={workspaceId} currentWorkspaceName={workspace?.name}>
        <ErrorState fullPage title="Couldn't load this board" onRetry={() => refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell
      currentWorkspaceId={workspaceId}
      currentWorkspaceName={workspace?.name}
      boardName={boardFull?.board.name}
    >
      <div className="flex h-full flex-col bg-contour-canvas">
        {isLoading || !boardFull ? (
          <div className="flex flex-1 flex-col gap-4 p-6">
            <SkeletonBlock className="h-8 w-64" />
            <div className="flex gap-4">
              <SkeletonBlock className="h-96 w-72 rounded-lg" />
              <SkeletonBlock className="h-96 w-72 rounded-lg" />
              <SkeletonBlock className="h-96 w-72 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center border-b border-border-default bg-surface shadow-xs">
              <div className="flex-1">
                <BoardHeader
                  board={boardFull.board}
                  columns={boardFull.columns}
                  tasks={boardFull.tasks}
                  canEdit={!!canEdit}
                  onRename={(name) => renameBoard.mutateAsync(name).then(() => undefined)}
                />
              </div>
              {canDeleteBoard && (
                <div className="relative pr-6">
                  <IconButton
                    ref={menuAnchorRef}
                    label="More board actions"
                    onClick={() => setIsMenuOpen((v) => !v)}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <Popover
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    anchorRef={menuAnchorRef}
                    align="right"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteBoardOpen(true);
                      }}
                      className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-body text-danger hover:bg-surface-hover"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete board
                    </button>
                  </Popover>
                </div>
              )}
            </div>

            {columns.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  title="No columns yet"
                  description={
                    canEdit
                      ? 'Add a column to start organizing this board - e.g. Backlog, In Progress, Done.'
                      : 'An owner or editor needs to add the first column.'
                  }
                  action={
                    canEdit
                      ? { label: 'Add column', onClick: () => createColumn.mutateAsync('Backlog') }
                      : undefined
                  }
                />
              </div>
            ) : isMobile ? (
              <DndContext
                sensors={dnd.sensors}
                collisionDetection={dnd.collisionDetection}
                onDragStart={dnd.handleDragStart}
                onDragOver={dnd.handleDragOver}
                onDragEnd={dnd.handleDragEnd}
                onDragCancel={dnd.handleDragCancel}
              >
                <ColumnSwitcher
                  columns={columns}
                  activeColumnId={activeColumnId}
                  onSelect={setActiveColumnId}
                />
                <div className="flex min-h-0 flex-1 p-4">
                  {columns
                    .filter((c) => c._id === activeColumnId)
                    .map((column) => (
                      <ColumnBand
                        key={column._id}
                        column={column}
                        tasks={orderedTasksForColumn(column._id)}
                        boardLabels={boardFull.board.labels}
                        members={workspace?.members ?? []}
                        currentUser={user}
                        canEdit={!!canEdit}
                        canDrag={!!canEdit}
                        pendingTaskIds={dnd.pendingTaskIds}
                        selectedTaskId={selectedTaskId}
                        onOpenTask={setSelectedTaskId}
                        onCreateTask={(title) =>
                          createTask
                            .mutateAsync({ columnId: column._id, payload: { title } })
                            .then(() => announce(`Task "${title}" added.`))
                        }
                        onRenameColumn={(name) =>
                          renameColumn
                            .mutateAsync({ columnId: column._id, name })
                            .then(() => undefined)
                        }
                        onDeleteColumn={() =>
                          deleteColumn
                            .mutateAsync(column._id)
                            .then(() => announce(`Column "${column.name}" deleted.`))
                        }
                      />
                    ))}
                </div>
                <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                  {dnd.activeTask ? (
                    <div className="w-72 scale-[1.02] shadow-dragged">
                      <TaskCard
                        task={dnd.activeTask}
                        boardLabels={boardFull.board.labels}
                        members={workspace?.members ?? []}
                        currentUser={user}
                        isSelected={false}
                        onOpen={() => undefined}
                        canDrag={false}
                        isDragging
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <DndContext
                sensors={dnd.sensors}
                collisionDetection={dnd.collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={columnDnd.columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto px-6 py-5">
                    {columns.map((column) => (
                      <SortableColumnBand
                        key={column._id}
                        column={column}
                        tasks={orderedTasksForColumn(column._id)}
                        boardLabels={boardFull.board.labels}
                        members={workspace?.members ?? []}
                        currentUser={user}
                        canEdit={!!canEdit}
                        canDrag={!!canEdit}
                        canReorderColumn={!!canEdit}
                        isColumnPending={columnDnd.pendingColumnIds.has(column._id)}
                        pendingTaskIds={dnd.pendingTaskIds}
                        selectedTaskId={selectedTaskId}
                        onOpenTask={setSelectedTaskId}
                        onCreateTask={(title) =>
                          createTask
                            .mutateAsync({ columnId: column._id, payload: { title } })
                            .then(() => announce(`Task "${title}" added.`))
                        }
                        onRenameColumn={(name) =>
                          renameColumn
                            .mutateAsync({ columnId: column._id, name })
                            .then(() => undefined)
                        }
                        onDeleteColumn={() =>
                          deleteColumn
                            .mutateAsync(column._id)
                            .then(() => announce(`Column "${column.name}" deleted.`))
                        }
                      />
                    ))}
                    {canEdit && (
                      <div className="shrink-0">
                        <AddColumnForm
                          onCreate={(name) =>
                            createColumn
                              .mutateAsync(name)
                              .then(() => announce(`Column "${name}" added.`))
                          }
                        />
                      </div>
                    )}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                  {dnd.activeTask ? (
                    <div className="w-72 scale-[1.02] shadow-dragged">
                      <TaskCard
                        task={dnd.activeTask}
                        boardLabels={boardFull.board.labels}
                        members={workspace?.members ?? []}
                        currentUser={user}
                        isSelected={false}
                        onOpen={() => undefined}
                        canDrag={false}
                        isDragging
                      />
                    </div>
                  ) : columnDnd.activeColumn ? (
                    <div className="h-[70vh] w-72 rounded-lg shadow-dragged">
                      <ColumnBand
                        column={columnDnd.activeColumn}
                        tasks={orderedTasksForColumn(columnDnd.activeColumn._id)}
                        boardLabels={boardFull.board.labels}
                        members={workspace?.members ?? []}
                        currentUser={user}
                        canEdit={false}
                        canDrag={false}
                        pendingTaskIds={new Set()}
                        selectedTaskId={null}
                        onOpenTask={() => undefined}
                        onCreateTask={async () => undefined}
                        onRenameColumn={async () => undefined}
                        onDeleteColumn={async () => undefined}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </>
        )}
      </div>

      {selectedTask && boardFull && (
        <TaskDetailPanel
          boardId={boardId as string}
          task={selectedTask}
          boardLabels={boardFull.board.labels}
          members={workspace?.members ?? []}
          currentUser={user}
          canEdit={!!canEdit}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {boardFull && (
        <ConfirmDeleteModal
          isOpen={isDeleteBoardOpen}
          onClose={() => setIsDeleteBoardOpen(false)}
          onConfirm={async () => {
            await deleteBoard.mutateAsync();
            navigate(`/workspaces/${workspaceId}`);
          }}
          title="Delete board"
          description={`Delete "${boardFull.board.name}" and its ${boardFull.columns.length} column${
            boardFull.columns.length === 1 ? '' : 's'
          } and ${boardFull.tasks.length} task${boardFull.tasks.length === 1 ? '' : 's'}? This can't be undone.`}
        />
      )}
    </AppShell>
  );
}

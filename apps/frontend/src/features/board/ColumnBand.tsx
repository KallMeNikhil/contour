import { forwardRef, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import type {
  Column,
  Task,
  BoardLabel,
  WorkspaceMemberSummary,
  PublicUser,
} from '../../services/api/types';
import { SortableTaskCard } from './dnd/SortableTaskCard';
import { DroppableColumnList } from './dnd/DroppableColumnList';
import { AddTaskInline } from './AddTaskInline';
import { InlineEditableText } from '../../components/InlineEditableText';
import { IconButton } from '../../components/Button';
import { Popover } from '../../components/Popover';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ColumnBandProps {
  column: Column;

  tasks: Task[];
  boardLabels: BoardLabel[];
  members: WorkspaceMemberSummary[];
  currentUser: PublicUser | null;
  canEdit: boolean;

  canDrag: boolean;
  pendingTaskIds: Set<string>;
  selectedTaskId: string | null;
  onOpenTask: (taskId: string) => void;
  onCreateTask: (title: string) => Promise<void>;
  onRenameColumn: (name: string) => Promise<void>;
  onDeleteColumn: () => Promise<void>;

  canReorderColumn?: boolean;
  isColumnDragging?: boolean;
  isColumnPending?: boolean;
  columnDragStyle?: CSSProperties;
  columnDragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}

export const ColumnBand = forwardRef<HTMLDivElement, ColumnBandProps>(function ColumnBand(
  {
    column,
    tasks,
    boardLabels,
    members,
    currentUser,
    canEdit,
    canDrag,
    pendingTaskIds,
    selectedTaskId,
    onOpenTask,
    onCreateTask,
    onRenameColumn,
    onDeleteColumn,
    canReorderColumn = false,
    isColumnDragging = false,
    isColumnPending = false,
    columnDragStyle,
    columnDragHandleProps,
  },
  ref,
) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      ref={ref}
      style={columnDragStyle}
      className={`group/column flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--column-divider)] bg-[var(--bg-column)] shadow-xs transition-all duration-micro ${
        isColumnDragging ? 'opacity-80 shadow-md' : ''
      } ${isColumnPending ? 'opacity-70' : ''}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--column-header-rule)] bg-[var(--bg-column)] px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-1">
          {canReorderColumn && (
            <button
              type="button"
              aria-label={`Reorder column "${column.name}". Press space or enter to pick up, then use arrow keys to move it and space or enter again to drop.`}
              className="-ml-1 flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted opacity-0 transition-opacity duration-micro hover:bg-[var(--bg-surface-hover)] hover:text-secondary focus-visible:opacity-100 group-hover/column:opacity-100 active:cursor-grabbing"
              {...columnDragHandleProps}
            >
              <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <InlineEditableText
            value={column.name}
            onSave={onRenameColumn}
            canEdit={canEdit}
            maxLength={60}
            ariaLabel="Column name"
            className="truncate text-column-header text-primary"
          />
          <span className="font-data text-data text-muted">{tasks.length}</span>
        </div>
        {canEdit && (
          <div className="relative">
            <IconButton
              ref={menuAnchorRef}
              label={`More actions for ${column.name}`}
              size="sm"
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
                  setIsConfirmOpen(true);
                }}
                className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-body text-danger hover:bg-[var(--bg-surface-hover)]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete column
              </button>
            </Popover>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
        <DroppableColumnList
          columnId={column._id}
          taskIds={tasks.map((t) => t._id)}
          isEmpty={tasks.length === 0}
          emptyLabel={
            canDrag ? 'No tasks yet - add one below, or drop a task here' : 'No tasks yet'
          }
        >
          {tasks.map((task) => (
            <li key={task._id}>
              <SortableTaskCard
                task={task}
                columnId={column._id}
                boardLabels={boardLabels}
                members={members}
                currentUser={currentUser}
                isSelected={selectedTaskId === task._id}
                canDrag={canDrag}
                isPending={pendingTaskIds.has(task._id)}
                onOpen={() => onOpenTask(task._id)}
              />
            </li>
          ))}
        </DroppableColumnList>
      </div>

      {canEdit && (
        <div className="border-t border-[var(--column-divider)] px-2.5 py-2">
          <AddTaskInline onCreate={onCreateTask} />
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onDeleteColumn}
        title="Delete column"
        description={
          tasks.length > 0
            ? `Delete "${column.name}" and its ${tasks.length} task${tasks.length === 1 ? '' : 's'}? This can't be undone.`
            : `Delete "${column.name}"? This can't be undone.`
        }
      />
    </div>
  );
});

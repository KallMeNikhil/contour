import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  Column,
  Task,
  BoardLabel,
  WorkspaceMemberSummary,
  PublicUser,
} from '../../../services/api/types';
import { ColumnBand } from '../ColumnBand';

interface SortableColumnBandProps {
  column: Column;
  tasks: Task[];
  boardLabels: BoardLabel[];
  members: WorkspaceMemberSummary[];
  currentUser: PublicUser | null;
  canEdit: boolean;
  canDrag: boolean;
  canReorderColumn: boolean;
  isColumnPending: boolean;
  pendingTaskIds: Set<string>;
  selectedTaskId: string | null;
  onOpenTask: (taskId: string) => void;
  onCreateTask: (title: string) => Promise<void>;
  onRenameColumn: (name: string) => Promise<void>;
  onDeleteColumn: () => Promise<void>;
}

export function SortableColumnBand({
  column,
  tasks,
  boardLabels,
  members,
  currentUser,
  canEdit,
  canDrag,
  canReorderColumn,
  isColumnPending,
  pendingTaskIds,
  selectedTaskId,
  onOpenTask,
  onCreateTask,
  onRenameColumn,
  onDeleteColumn,
}: SortableColumnBandProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column._id,
    disabled: !canReorderColumn,
    data: { type: 'column' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ColumnBand
      ref={setNodeRef}
      columnDragStyle={style}
      column={column}
      tasks={tasks}
      boardLabels={boardLabels}
      members={members}
      currentUser={currentUser}
      canEdit={canEdit}
      canDrag={canDrag}
      canReorderColumn={canReorderColumn}
      isColumnDragging={isDragging}
      isColumnPending={isColumnPending}
      columnDragHandleProps={{ ...attributes, ...listeners }}
      pendingTaskIds={pendingTaskIds}
      selectedTaskId={selectedTaskId}
      onOpenTask={onOpenTask}
      onCreateTask={onCreateTask}
      onRenameColumn={onRenameColumn}
      onDeleteColumn={onDeleteColumn}
    />
  );
}

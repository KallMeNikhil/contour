import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  Task,
  BoardLabel,
  WorkspaceMemberSummary,
  PublicUser,
} from '../../../services/api/types';
import { TaskCard } from '../TaskCard';

interface SortableTaskCardProps {
  task: Task;
  columnId: string;
  boardLabels: BoardLabel[];
  members: WorkspaceMemberSummary[];
  currentUser: PublicUser | null;
  isSelected: boolean;
  canDrag: boolean;
  isPending: boolean;
  onOpen: () => void;
}

export function SortableTaskCard({
  task,
  columnId,
  boardLabels,
  members,
  currentUser,
  isSelected,
  canDrag,
  isPending,
  onOpen,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled: !canDrag,
    data: { type: 'task', columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      task={task}
      boardLabels={boardLabels}
      members={members}
      currentUser={currentUser}
      isSelected={isSelected}
      onOpen={onOpen}
      canDrag={canDrag}
      isDragging={isDragging}
      isPending={isPending}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

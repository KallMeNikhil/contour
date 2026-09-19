import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { GripVertical } from 'lucide-react';
import type {
  Task,
  BoardLabel,
  WorkspaceMemberSummary,
  PublicUser,
} from '../../services/api/types';
import { Avatar } from '../../components/Avatar';
import { Chip, resolveLabelColor } from '../../components/Chip';
import { resolveAssigneeLabel, formatDueDate } from './formatting';

interface TaskCardProps {
  task: Task;
  boardLabels: BoardLabel[];
  members: WorkspaceMemberSummary[];
  currentUser: PublicUser | null;
  isSelected: boolean;
  onOpen: () => void;

  canDrag?: boolean;

  isDragging?: boolean;

  isPending?: boolean;

  style?: CSSProperties;

  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;

  /** Extra class names appended to the card's root element. */
  className?: string;
}

const MAX_VISIBLE_LABELS = 3;

const dueDateToneClass: Record<'muted' | 'warning' | 'danger', string> = {
  muted: 'text-muted',
  warning: 'text-warning',
  danger: 'text-danger',
};

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
  {
    task,
    boardLabels,
    members,
    currentUser,
    isSelected,
    onOpen,
    canDrag = false,
    isDragging = false,
    isPending = false,
    style,
    dragHandleProps,
    className = '',
  },
  ref,
) {
  const labels = task.labelIds
    .map((id) => boardLabels.find((l) => l._id === id))
    .filter((l): l is BoardLabel => !!l);
  const visibleLabels = labels.slice(0, MAX_VISIBLE_LABELS);
  const overflowCount = labels.length - visibleLabels.length;
  const accentColor = labels[0] ? resolveLabelColor(labels[0].color) : undefined;
  const due = formatDueDate(task.dueDate);
  const assigneeLabel = resolveAssigneeLabel(task.assigneeId, currentUser, members);

  const mergedStyle: CSSProperties = {
    ...style,
    borderLeftWidth: accentColor ? '2px' : undefined,
    borderLeftColor: accentColor,
  };

  return (
    <div
      ref={ref}
      style={mergedStyle}
      className={`group/task relative flex w-full flex-col gap-2 rounded-lg border bg-surface p-3.5 shadow-xs transition-all duration-micro ease-settle ${
        isSelected
          ? 'border-accent bg-selected shadow-sm'
          : 'border-border-default hover:-translate-y-px hover:border-border-strong hover:shadow-sm'
      } ${isDragging ? 'rotate-1 opacity-90' : ''} ${isPending ? 'opacity-70' : ''} ${className}`}
    >
      <div className="flex items-start gap-1">
        {canDrag && (
          <button
            type="button"
            aria-label={`Reorder task "${task.title}". Press space or enter to pick up, then use arrow keys to move it and space or enter again to drop.`}
            className="-ml-1 mt-0.5 flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted opacity-0 transition-opacity duration-micro hover:bg-surface-hover hover:text-secondary focus-visible:opacity-100 group-hover/task:opacity-100 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpen}
          aria-current={isSelected || undefined}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-task-title leading-snug text-primary">{task.title}</span>
          {(task.assigneeId || task.dueDate || labels.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {task.assigneeId && <Avatar name={assigneeLabel} />}
              {task.dueDate && (
                <span className={`font-data text-data ${dueDateToneClass[due.tone]}`}>
                  {due.text}
                </span>
              )}
              {visibleLabels.map((label) => (
                <Chip key={label._id} color={label.color}>
                  {label.name}
                </Chip>
              ))}
              {overflowCount > 0 && (
                <span className="text-meta text-muted">+{overflowCount} more</span>
              )}
            </div>
          )}
        </button>
      </div>
      {isPending && (
        <span className="sr-only" role="status">
          Saving new position…
        </span>
      )}
    </div>
  );
});

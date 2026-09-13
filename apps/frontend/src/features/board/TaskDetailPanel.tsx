import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { Input, Textarea } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { resolveMemberLabel } from './formatting';
import { useUpdateTask, useDeleteTask, boardKeys } from './hooks';
import * as boardsApi from '../../services/api/boards';
import { useToast } from '../../state/toast';
import { useAnnouncer } from '../../state/announcer';
import { ApiError } from '../../services/api/client';
import type {
  Task,
  BoardLabel,
  WorkspaceMemberSummary,
  PublicUser,
} from '../../services/api/types';

interface TaskDetailPanelProps {
  boardId: string;
  task: Task;
  boardLabels: BoardLabel[];
  members: WorkspaceMemberSummary[];
  currentUser: PublicUser | null;
  canEdit: boolean;
  onClose: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'conflict';

export function TaskDetailPanel({
  boardId,
  task,
  boardLabels,
  members,
  currentUser,
  canEdit,
  onClose,
}: TaskDetailPanelProps) {
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { announce } = useAnnouncer();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setSaveState('idle');
  }, [task._id]);

  async function save(patch: Record<string, unknown>) {
    setSaveState('saving');
    try {
      await updateTask.mutateAsync({
        taskId: task._id,
        payload: { ...patch, version: task.version },
      });
      setSaveState('saved');
      announce('Task saved.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSaveState('conflict');
      } else {
        setSaveState('idle');
        showToast("Couldn't save your change.", {
          tone: 'error',
          actionLabel: 'Retry',
          onAction: () => save(patch),
        });
      }
    }
  }

  async function handleReloadFromConflict() {
    const result = await queryClient.fetchQuery({
      queryKey: boardKeys.full(boardId),
      queryFn: () => boardsApi.getBoardFull(boardId),
    });
    const fresh = result.tasks.find((t) => t._id === task._id);
    if (fresh) {
      setTitle(fresh.title);
      setDescription(fresh.description);
    }
    setSaveState('idle');
  }

  function toggleLabel(labelId: string) {
    if (!canEdit || saveState === 'saving') return;
    const next = task.labelIds.includes(labelId)
      ? task.labelIds.filter((id) => id !== labelId)
      : [...task.labelIds, labelId];
    save({ labelIds: next });
  }

  async function handleDelete() {
    await deleteTask.mutateAsync(task._id);
    announce('Task deleted.');
    onClose();
  }

  const assignableMembers = members;

  return (
    <Drawer isOpen onClose={onClose} title="Task">
      <div className="flex flex-col gap-5">
        <Input
          label="Title"
          value={title}
          disabled={!canEdit}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() && title !== task.title) save({ title: title.trim() });
          }}
        />

        <Textarea
          label="Description"
          value={description}
          disabled={!canEdit}
          rows={5}
          maxLength={10000}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== task.description) save({ description });
          }}
        />

        <Select
          label="Assignee"
          disabled={!canEdit || saveState === 'saving'}
          value={task.assigneeId ?? ''}
          onChange={(e) => save({ assigneeId: e.target.value || null })}
        >
          <option value="">Unassigned</option>
          {assignableMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {resolveMemberLabel(m.userId, currentUser, members)}
            </option>
          ))}
        </Select>

        <Input
          label="Due date"
          type="date"
          disabled={!canEdit || saveState === 'saving'}
          value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
          onChange={(e) =>
            save({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })
          }
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-body-medium text-secondary">Labels</span>
          <div className="flex flex-wrap gap-1.5">
            {boardLabels.length === 0 && (
              <span className="text-meta text-muted">No labels on this board yet.</span>
            )}
            {boardLabels.map((label) => {
              const isActive = task.labelIds.includes(label._id);
              return (
                <button
                  key={label._id}
                  type="button"
                  disabled={!canEdit || saveState === 'saving'}
                  onClick={() => toggleLabel(label._id)}
                  className={`transition-opacity duration-micro ${isActive ? '' : 'opacity-40 hover:opacity-100'}`}
                >
                  <Chip color={label.color}>{label.name}</Chip>
                </button>
              );
            })}
          </div>
        </div>

        {saveState === 'conflict' && (
          <div role="alert" className="rounded-md border border-warning/50 bg-warning/10 p-3.5">
            <p className="text-body-medium text-primary">This task changed elsewhere.</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleReloadFromConflict}>
                Reload latest version
              </Button>
            </div>
          </div>
        )}

        <p className="font-data text-data text-muted" aria-live="polite">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && `Saved · version ${task.version}`}
          {saveState === 'idle' && `Last saved · version ${task.version}`}
        </p>

        {canEdit && (
          <div className="border-t border-border-default pt-5">
            <Button variant="danger" size="sm" onClick={() => setIsConfirmOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete task
            </Button>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete task"
        description={`Delete "${task.title}"? This can't be undone.`}
      />
    </Drawer>
  );
}

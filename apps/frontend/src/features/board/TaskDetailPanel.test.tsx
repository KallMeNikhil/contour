import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskDetailPanel } from './TaskDetailPanel';
import { boardKeys } from './hooks';
import { ToastProvider } from '../../state/toast';
import { AnnouncerProvider } from '../../state/announcer';
import * as tasksApi from '../../services/api/tasks';
import type { BoardLabel, Task } from '../../services/api/types';

vi.mock('../../services/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api/tasks')>();
  return { ...actual, updateTask: vi.fn(), deleteTask: vi.fn() };
});

const BOARD_ID = 'board-1';

const labelA: BoardLabel = { _id: 'label-a', name: 'A', color: '#111111' };
const labelB: BoardLabel = { _id: 'label-b', name: 'B', color: '#222222' };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    _id: 't1',
    boardId: BOARD_ID,
    columnId: 'col-1',
    title: 'A task',
    description: '',
    assigneeId: null,
    labelIds: [],
    dueDate: null,
    position: 1000,
    version: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPanel(task: Task) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }
  render(
    <TaskDetailPanel
      boardId={BOARD_ID}
      task={task}
      boardLabels={[labelA, labelB]}
      members={[]}
      currentUser={null}
      canEdit
      onClose={vi.fn()}
    />,
    { wrapper },
  );
  return { queryClient };
}

beforeEach(() => {
  vi.mocked(tasksApi.updateTask).mockReset();
});

describe('TaskDetailPanel - M7 fix: self-inflicted version conflicts', () => {
  it('ignores a second label click while the first save is still in flight, instead of firing a second concurrent request', async () => {
    let resolveFirst!: (task: Task) => void;
    vi.mocked(tasksApi.updateTask).mockReturnValueOnce(
      new Promise<Task>((resolve) => {
        resolveFirst = resolve;
      }),
    );

    const task = makeTask({ labelIds: [] });
    renderPanel(task);
    const user = userEvent.setup();

    const buttonA = screen.getByRole('button', { name: 'A' });
    await user.click(buttonA);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'B' })).toBeDisabled();
    });

    expect(tasksApi.updateTask).toHaveBeenCalledTimes(1);

    resolveFirst(makeTask({ labelIds: ['label-a'], version: 1 }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'B' })).not.toBeDisabled());
  });

  it('writes the resolved task version into the cache so a subsequent save uses the fresh version', async () => {
    vi.mocked(tasksApi.updateTask).mockResolvedValue(
      makeTask({ labelIds: ['label-a'], version: 1 }),
    );

    const task = makeTask({ labelIds: [] });
    const { queryClient } = renderPanel(task);
    queryClient.setQueryData(boardKeys.full(BOARD_ID), {
      board: {
        _id: BOARD_ID,
        workspaceId: 'ws-1',
        name: 'Board',
        labels: [labelA, labelB],
        createdAt: '',
        updatedAt: '',
      },
      columns: [],
      tasks: [task],
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'A' }));

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ tasks: Task[] }>(boardKeys.full(BOARD_ID));
      expect(cached?.tasks.find((t) => t._id === 't1')?.version).toBe(1);
    });
  });
});

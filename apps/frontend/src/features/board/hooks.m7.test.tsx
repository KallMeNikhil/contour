import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteBoard, useUpdateTask, useDeleteTask, boardKeys } from './hooks';
import { workspaceKeys } from '../workspace/hooks';
import * as boardsApi from '../../services/api/boards';
import * as tasksApi from '../../services/api/tasks';
import type { BoardFull, Task } from '../../services/api/types';

vi.mock('../../services/api/boards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api/boards')>();
  return { ...actual, deleteBoard: vi.fn() };
});

vi.mock('../../services/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api/tasks')>();
  return { ...actual, updateTask: vi.fn(), deleteTask: vi.fn() };
});

const WORKSPACE_ID = 'ws-1';
const BOARD_ID = 'board-1';

function makeTask(overrides: Partial<Task>): Task {
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

function makeBoardFull(tasks: Task[]): BoardFull {
  return {
    board: {
      _id: BOARD_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Board',
      labels: [],
      createdAt: '',
      updatedAt: '',
    },
    columns: [
      {
        _id: 'col-1',
        boardId: BOARD_ID,
        name: 'To do',
        position: 1000,
        createdAt: '',
        updatedAt: '',
      },
    ],
    tasks,
  };
}

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.mocked(boardsApi.deleteBoard).mockReset();
  vi.mocked(tasksApi.updateTask).mockReset();
  vi.mocked(tasksApi.deleteTask).mockReset();
});

describe('useDeleteBoard (M7 fix: stale board-list cache after delete)', () => {
  it('invalidates the parent workspace boards list and drops the board-full cache entry on success', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(boardKeys.full(BOARD_ID), makeBoardFull([]));
    queryClient.setQueryData(workspaceKeys.boards(WORKSPACE_ID), [
      { _id: BOARD_ID, workspaceId: WORKSPACE_ID, name: 'Board', labels: [] },
    ]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(boardsApi.deleteBoard).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteBoard(WORKSPACE_ID, BOARD_ID), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: workspaceKeys.boards(WORKSPACE_ID) }),
    );

    expect(queryClient.getQueryData(boardKeys.full(BOARD_ID))).toBeUndefined();
  });
});

describe('useUpdateTask (M7 fix: merge server response instead of invalidate-only)', () => {
  it('writes the returned task straight into the board cache on success', async () => {
    const t1 = makeTask({ _id: 't1', version: 0, title: 'Old title' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(boardKeys.full(BOARD_ID), makeBoardFull([t1]));
    const updated = makeTask({ _id: 't1', version: 1, title: 'New title' });
    vi.mocked(tasksApi.updateTask).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateTask(BOARD_ID), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        taskId: 't1',
        payload: { title: 'New title', version: 0 },
      });
    });

    const cached = queryClient
      .getQueryData<BoardFull>(boardKeys.full(BOARD_ID))
      ?.tasks.find((t) => t._id === 't1');
    expect(cached?.version).toBe(1);
    expect(cached?.title).toBe('New title');
  });
});

describe('useDeleteTask (M7 fix: remove from cache on success)', () => {
  it('removes the deleted task from the board cache immediately', async () => {
    const t1 = makeTask({ _id: 't1' });
    const t2 = makeTask({ _id: 't2' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(boardKeys.full(BOARD_ID), makeBoardFull([t1, t2]));
    vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTask(BOARD_ID), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('t1');
    });

    const cached = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(cached?.tasks.map((t) => t._id)).toEqual(['t2']);
  });
});

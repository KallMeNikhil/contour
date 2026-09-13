import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMoveTask, boardKeys } from './hooks';
import * as tasksApi from '../../services/api/tasks';
import type { BoardFull, Task } from '../../services/api/types';

vi.mock('../../services/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api/tasks')>();
  return { ...actual, moveTask: vi.fn() };
});

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
      workspaceId: 'ws-1',
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
      {
        _id: 'col-2',
        boardId: BOARD_ID,
        name: 'Done',
        position: 2000,
        createdAt: '',
        updatedAt: '',
      },
    ],
    tasks,
  };
}

function setup(initial: BoardFull) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(boardKeys.full(BOARD_ID), initial);
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  const { result } = renderHook(() => useMoveTask(BOARD_ID), { wrapper });
  return { queryClient, result };
}

beforeEach(() => {
  vi.mocked(tasksApi.moveTask).mockReset();
});

describe('useMoveTask', () => {
  it('optimistically updates the moved task in the cache before the request resolves', async () => {
    const t1 = makeTask({ _id: 't1', columnId: 'col-1', position: 1000 });
    const t2 = makeTask({ _id: 't2', columnId: 'col-2', position: 2000 });
    const initial = makeBoardFull([t1, t2]);
    let resolveRequest!: (task: Task) => void;
    vi.mocked(tasksApi.moveTask).mockReturnValue(
      new Promise<Task>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { queryClient, result } = setup(initial);

    act(() => {
      result.current.mutate({ taskId: 't1', payload: { columnId: 'col-2', afterTaskId: 't2' } });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
      expect(cached?.tasks.find((t) => t._id === 't1')?.columnId).toBe('col-2');
    });

    resolveRequest(makeTask({ _id: 't1', columnId: 'col-2', position: 500, version: 1 }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back to the previous cache state when the request fails', async () => {
    const t1 = makeTask({ _id: 't1', columnId: 'col-1' });
    const initial = makeBoardFull([t1]);
    vi.mocked(tasksApi.moveTask).mockRejectedValue(new Error('network down'));

    const { queryClient, result } = setup(initial);

    await act(async () => {
      try {
        await result.current.mutateAsync({ taskId: 't1', payload: { columnId: 'col-2' } });
      } catch {
        void 0;
      }
    });

    const cached = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(cached?.tasks.find((t) => t._id === 't1')?.columnId).toBe('col-1');
  });

  it('reconciles with the server canonical task on success', async () => {
    const t1 = makeTask({ _id: 't1', columnId: 'col-1', position: 1000, version: 0 });
    const initial = makeBoardFull([t1]);
    const serverTask = makeTask({ _id: 't1', columnId: 'col-2', position: 750, version: 1 });
    vi.mocked(tasksApi.moveTask).mockResolvedValue(serverTask);

    const { queryClient, result } = setup(initial);

    await act(async () => {
      await result.current.mutateAsync({ taskId: 't1', payload: { columnId: 'col-2' } });
    });

    const cached = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    const stored = cached?.tasks.find((t) => t._id === 't1');
    expect(stored?.position).toBe(750);
    expect(stored?.version).toBe(1);
  });

  it('ignores a stale response when the same task is moved again before the first request resolves', async () => {
    const t1 = makeTask({ _id: 't1', columnId: 'col-1', position: 1000 });
    const initial = makeBoardFull([t1]);

    let resolveFirst!: (task: Task) => void;
    let resolveSecond!: (task: Task) => void;
    vi.mocked(tasksApi.moveTask)
      .mockImplementationOnce(
        () =>
          new Promise<Task>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Task>((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { queryClient, result } = setup(initial);

    act(() => {
      result.current.mutate({ taskId: 't1', payload: { columnId: 'col-2' } });
    });
    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<BoardFull>(boardKeys.full(BOARD_ID))
          ?.tasks.find((t) => t._id === 't1')?.columnId,
      ).toBe('col-2'),
    );

    act(() => {
      result.current.mutate({ taskId: 't1', payload: { columnId: 'col-1' } });
    });
    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<BoardFull>(boardKeys.full(BOARD_ID))
          ?.tasks.find((t) => t._id === 't1')?.columnId,
      ).toBe('col-1'),
    );

    act(() => {
      resolveSecond(makeTask({ _id: 't1', columnId: 'col-1', position: 999, version: 5 }));
    });
    await waitFor(() => {
      const stored = queryClient
        .getQueryData<BoardFull>(boardKeys.full(BOARD_ID))
        ?.tasks.find((t) => t._id === 't1');
      expect(stored?.version).toBe(5);
    });

    act(() => {
      resolveFirst(makeTask({ _id: 't1', columnId: 'col-2', position: 1, version: 1 }));
    });

    const finalTask = queryClient
      .getQueryData<BoardFull>(boardKeys.full(BOARD_ID))
      ?.tasks.find((t) => t._id === 't1');
    expect(finalTask?.columnId).toBe('col-1');
    expect(finalTask?.version).toBe(5);
  });
});

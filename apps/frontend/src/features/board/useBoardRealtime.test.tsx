import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventEmitter } from 'node:events';
import { useBoardRealtime } from './useBoardRealtime';
import { boardKeys } from './hooks';
import type { BoardFull, Task } from '../../services/api/types';

class FakeSocket extends EventEmitter {
  connected = true;
  connect = vi.fn();
  emit = vi.fn((event: string, ...args: unknown[]) => {
    super.emit(event, ...args);
    return true;
  });
}

const fakeSocket = new FakeSocket();

vi.mock('../../services/realtime/socket', () => ({
  getSocket: () => fakeSocket,
}));

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
  renderHook(() => useBoardRealtime(BOARD_ID), { wrapper });
  return { queryClient };
}

beforeEach(() => {
  fakeSocket.removeAllListeners();
  fakeSocket.connected = true;
  fakeSocket.connect.mockClear();
  fakeSocket.emit.mockClear();
});

describe('useBoardRealtime', () => {
  it('joins the board room immediately when already connected', () => {
    setup(makeBoardFull([]));
    expect(fakeSocket.emit).toHaveBeenCalledWith('board:join', BOARD_ID);
    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });

  it('connects (rather than joining directly) when not yet connected', () => {
    fakeSocket.connected = false;
    setup(makeBoardFull([]));
    expect(fakeSocket.connect).toHaveBeenCalled();
  });

  it('adds a task on task:created', () => {
    const { queryClient } = setup(makeBoardFull([]));
    const task = makeTask({ _id: 't-new' });
    fakeSocket.emit('task:created', task);
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data?.tasks.map((t) => t._id)).toContain('t-new');
  });

  it('replaces a task wholesale on task:updated', () => {
    const original = makeTask({ _id: 't1', title: 'Old title' });
    const { queryClient } = setup(makeBoardFull([original]));
    fakeSocket.emit('task:updated', { ...original, title: 'New title' });
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data?.tasks[0].title).toBe('New title');
  });

  it('ignores a stale task:updated event older than the local copy', () => {
    const fresh = makeTask({ _id: 't1', title: 'Fresh', updatedAt: '2026-02-01T00:00:00.000Z' });
    const { queryClient } = setup(makeBoardFull([fresh]));
    const stale = makeTask({ _id: 't1', title: 'Stale', updatedAt: '2026-01-01T00:00:00.000Z' });
    fakeSocket.emit('task:updated', stale);
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data?.tasks[0].title).toBe('Fresh');
  });

  it('removes a task on task:deleted', () => {
    const task = makeTask({ _id: 't1' });
    const { queryClient } = setup(makeBoardFull([task]));
    fakeSocket.emit('task:deleted', { _id: 't1' });
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data?.tasks).toHaveLength(0);
  });

  it('removes a column and its tasks together on column:deleted', () => {
    const task = makeTask({ _id: 't1', columnId: 'col-1' });
    const { queryClient } = setup(makeBoardFull([task]));
    fakeSocket.emit('column:deleted', { _id: 'col-1' });
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data?.columns).toHaveLength(0);
    expect(data?.tasks).toHaveLength(0);
  });

  it('removes the board entirely from the cache on board:deleted', () => {
    const { queryClient } = setup(makeBoardFull([]));
    fakeSocket.emit('board:deleted', { _id: BOARD_ID });
    const data = queryClient.getQueryData<BoardFull>(boardKeys.full(BOARD_ID));
    expect(data).toBeUndefined();
  });

  it('rejoins the room and invalidates the board on reconnect', () => {
    const { queryClient } = setup(makeBoardFull([]));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    fakeSocket.emit('connect');
    expect(fakeSocket.emit).toHaveBeenCalledWith('board:join', BOARD_ID);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.full(BOARD_ID) });
  });
});

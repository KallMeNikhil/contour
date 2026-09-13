import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useBoardDnd, columnDropId } from './useBoardDnd';
import { boardKeys } from '../hooks';
import * as tasksApi from '../../../services/api/tasks';
import type { BoardFull, Column, Task } from '../../../services/api/types';
import { ToastProvider } from '../../../state/toast';
import { AnnouncerProvider } from '../../../state/announcer';

vi.mock('../../../services/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/api/tasks')>();
  return { ...actual, moveTask: vi.fn() };
});

const BOARD_ID = 'board-1';

const columns: Column[] = [
  { _id: 'col-1', boardId: BOARD_ID, name: 'To do', position: 1000, createdAt: '', updatedAt: '' },
  { _id: 'col-2', boardId: BOARD_ID, name: 'Done', position: 2000, createdAt: '', updatedAt: '' },
];

function makeTask(id: string, columnId: string, position: number): Task {
  return {
    _id: id,
    boardId: BOARD_ID,
    columnId,
    title: `Task ${id}`,
    description: '',
    assigneeId: null,
    labelIds: [],
    dueDate: null,
    position,
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function fakeDragStart(id: string): DragStartEvent {
  return {
    active: {
      id,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
  } as unknown as DragStartEvent;
}

function fakeOverEvent(
  activeId: string,
  overId: string | null,
  overData?: { type: 'task' | 'column'; columnId: string },
): DragEndEvent {
  return {
    active: { id: activeId, data: { current: undefined } },
    over: overId ? { id: overId, data: { current: overData }, rect: {} } : null,
  } as unknown as DragEndEvent & DragOverEvent;
}

function setup(tasks: Task[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const boardFull: BoardFull = {
    board: {
      _id: BOARD_ID,
      workspaceId: 'ws-1',
      name: 'Board',
      labels: [],
      createdAt: '',
      updatedAt: '',
    },
    columns,
    tasks,
  };
  queryClient.setQueryData(boardKeys.full(BOARD_ID), boardFull);

  const tasksByColumn = new Map<string, Task[]>();
  for (const column of columns) {
    tasksByColumn.set(
      column._id,
      tasks.filter((t) => t.columnId === column._id).sort((a, b) => a.position - b.position),
    );
  }

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  const { result } = renderHook(
    () => useBoardDnd({ boardId: BOARD_ID, columns, tasksByColumn, canEdit: true }),
    { wrapper },
  );

  return { queryClient, result };
}

beforeEach(() => {
  vi.mocked(tasksApi.moveTask).mockReset();
  vi.mocked(tasksApi.moveTask).mockResolvedValue(makeTask('t1', 'col-1', 500));
});

describe('useBoardDnd', () => {
  it('does not call moveTask when a task is picked up and dropped in its original spot', async () => {
    const tasks = [makeTask('t1', 'col-1', 1000), makeTask('t2', 'col-1', 2000)];
    const { result } = setup(tasks);

    act(() => result.current.handleDragStart(fakeDragStart('t1')));
    act(() =>
      result.current.handleDragEnd(fakeOverEvent('t1', 't1', { type: 'task', columnId: 'col-1' })),
    );

    expect(tasksApi.moveTask).not.toHaveBeenCalled();
  });

  it('resolves a middle-column reorder into the correct neighbor payload', async () => {
    const tasks = [
      makeTask('t1', 'col-1', 1000),
      makeTask('t2', 'col-1', 2000),
      makeTask('t3', 'col-1', 3000),
    ];
    const { result } = setup(tasks);

    act(() => result.current.handleDragStart(fakeDragStart('t3')));
    act(() =>
      result.current.handleDragOver(fakeOverEvent('t3', 't1', { type: 'task', columnId: 'col-1' })),
    );
    act(() =>
      result.current.handleDragEnd(fakeOverEvent('t3', 't1', { type: 'task', columnId: 'col-1' })),
    );

    await waitFor(() => expect(tasksApi.moveTask).toHaveBeenCalledTimes(1));
    expect(tasksApi.moveTask).toHaveBeenCalledWith('t3', {
      columnId: 'col-1',
      afterTaskId: 't1',
    });
  });

  it('resolves a cross-column drop into an empty column with no neighbors', async () => {
    const tasks = [makeTask('t1', 'col-1', 1000)];
    const { result } = setup(tasks);

    act(() => result.current.handleDragStart(fakeDragStart('t1')));
    act(() =>
      result.current.handleDragEnd(
        fakeOverEvent('t1', columnDropId('col-2'), { type: 'column', columnId: 'col-2' }),
      ),
    );

    await waitFor(() => expect(tasksApi.moveTask).toHaveBeenCalledTimes(1));
    expect(tasksApi.moveTask).toHaveBeenCalledWith('t1', { columnId: 'col-2' });
  });

  it('tracks the moved task as pending while the request is in flight and clears it after', async () => {
    let resolveMove!: (task: Task) => void;
    vi.mocked(tasksApi.moveTask).mockReturnValue(
      new Promise<Task>((resolve) => {
        resolveMove = resolve;
      }),
    );
    const tasks = [makeTask('t1', 'col-1', 1000)];
    const { result } = setup(tasks);

    act(() => result.current.handleDragStart(fakeDragStart('t1')));
    act(() =>
      result.current.handleDragEnd(
        fakeOverEvent('t1', columnDropId('col-2'), { type: 'column', columnId: 'col-2' }),
      ),
    );

    await waitFor(() => expect(result.current.pendingTaskIds.has('t1')).toBe(true));

    act(() => resolveMove(makeTask('t1', 'col-2', 500)));

    await waitFor(() => expect(result.current.pendingTaskIds.has('t1')).toBe(false));
  });

  it('resets drag state without calling moveTask when the drop target is invalid (cancelled)', () => {
    const tasks = [makeTask('t1', 'col-1', 1000)];
    const { result } = setup(tasks);

    act(() => result.current.handleDragStart(fakeDragStart('t1')));
    act(() => result.current.handleDragEnd(fakeOverEvent('t1', null)));

    expect(tasksApi.moveTask).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });
});

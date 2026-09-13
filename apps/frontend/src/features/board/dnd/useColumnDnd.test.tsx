import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useColumnDnd } from './useColumnDnd';
import { boardKeys } from '../hooks';
import * as columnsApi from '../../../services/api/columns';
import type { BoardFull, Column } from '../../../services/api/types';
import { ToastProvider } from '../../../state/toast';
import { AnnouncerProvider } from '../../../state/announcer';

vi.mock('../../../services/api/columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/api/columns')>();
  return { ...actual, moveColumn: vi.fn() };
});

const BOARD_ID = 'board-1';

function makeColumn(id: string, position: number, name = id): Column {
  return { _id: id, boardId: BOARD_ID, name, position, createdAt: '', updatedAt: '' };
}

function fakeDragStart(id: string): DragStartEvent {
  return {
    active: {
      id,
      data: { current: { type: 'column' } },
      rect: { current: { initial: null, translated: null } },
    },
  } as unknown as DragStartEvent;
}

function fakeOverEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId, data: { current: { type: 'column' } } },
    over: overId ? { id: overId, data: { current: { type: 'column' } }, rect: {} } : null,
  } as unknown as DragEndEvent & DragOverEvent;
}

function setup(columns: Column[]) {
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
    tasks: [],
  };
  queryClient.setQueryData(boardKeys.full(BOARD_ID), boardFull);

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  const { result } = renderHook(() => useColumnDnd({ boardId: BOARD_ID, columns, canEdit: true }), {
    wrapper,
  });

  return { queryClient, result };
}

beforeEach(() => {
  vi.mocked(columnsApi.moveColumn).mockReset();
  vi.mocked(columnsApi.moveColumn).mockResolvedValue(makeColumn('c1', 500));
});

describe('useColumnDnd', () => {
  it('does not call moveColumn when a column is picked up and dropped in its original spot', () => {
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000)];
    const { result } = setup(columns);

    act(() => result.current.handleDragStart(fakeDragStart('c1')));
    act(() => result.current.handleDragEnd(fakeOverEvent('c1', 'c1')));

    expect(columnsApi.moveColumn).not.toHaveBeenCalled();
  });

  it('resolves a middle reorder into the correct neighbor payload', async () => {
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000), makeColumn('c3', 3000)];
    const { result } = setup(columns);

    act(() => result.current.handleDragStart(fakeDragStart('c3')));
    act(() => result.current.handleDragOver(fakeOverEvent('c3', 'c1')));
    act(() => result.current.handleDragEnd(fakeOverEvent('c3', 'c1')));

    await waitFor(() => expect(columnsApi.moveColumn).toHaveBeenCalledTimes(1));
    expect(columnsApi.moveColumn).toHaveBeenCalledWith('c3', { afterColumnId: 'c1' });
  });

  it('moves the last column to the front', async () => {
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000)];
    const { result } = setup(columns);

    act(() => result.current.handleDragStart(fakeDragStart('c2')));
    act(() => result.current.handleDragEnd(fakeOverEvent('c2', 'c1')));

    await waitFor(() => expect(columnsApi.moveColumn).toHaveBeenCalledTimes(1));
    expect(columnsApi.moveColumn).toHaveBeenCalledWith('c2', { afterColumnId: 'c1' });
  });

  it('tracks the moved column as pending while the request is in flight and clears it after', async () => {
    let resolveMove!: (column: Column) => void;
    vi.mocked(columnsApi.moveColumn).mockReturnValue(
      new Promise<Column>((resolve) => {
        resolveMove = resolve;
      }),
    );
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000)];
    const { result } = setup(columns);

    act(() => result.current.handleDragStart(fakeDragStart('c2')));
    act(() => result.current.handleDragEnd(fakeOverEvent('c2', 'c1')));

    await waitFor(() => expect(result.current.pendingColumnIds.has('c2')).toBe(true));

    act(() => resolveMove(makeColumn('c2', 500)));

    await waitFor(() => expect(result.current.pendingColumnIds.has('c2')).toBe(false));
  });

  it('resets drag state without calling moveColumn when the drop target is invalid (cancelled)', () => {
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000)];
    const { result } = setup(columns);

    act(() => result.current.handleDragStart(fakeDragStart('c1')));
    act(() => result.current.handleDragEnd(fakeOverEvent('c1', null)));

    expect(columnsApi.moveColumn).not.toHaveBeenCalled();
    expect(result.current.isDraggingColumn).toBe(false);
  });

  it('ignores drag events that are not tagged as a column drag (task drags sharing the same DndContext)', () => {
    const columns = [makeColumn('c1', 1000), makeColumn('c2', 2000)];
    const { result } = setup(columns);

    const taskDragStart = {
      active: { id: 'some-task-id', data: { current: { type: 'task', columnId: 'c1' } } },
    } as unknown as DragStartEvent;

    act(() => result.current.handleDragStart(taskDragStart));

    expect(result.current.isDraggingColumn).toBe(false);
  });
});

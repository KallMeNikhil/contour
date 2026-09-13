import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../services/realtime/socket';
import { boardKeys } from './hooks';
import type { Board, BoardFull, Column, Task } from '../../services/api/types';

type EntityDeletedPayload = { _id: string };

export function useBoardRealtime(boardId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    const queryKey = boardKeys.full(boardId);

    function withBoardData(updater: (data: BoardFull) => BoardFull) {
      queryClient.setQueryData<BoardFull>(queryKey, (prev) => (prev ? updater(prev) : prev));
    }

    function isStale(existing: { updatedAt: string } | undefined, incoming: { updatedAt: string }) {
      return !!existing && existing.updatedAt > incoming.updatedAt;
    }

    function upsertTask(task: Task) {
      withBoardData((data) => {
        const existing = data.tasks.find((t) => t._id === task._id);
        if (isStale(existing, task)) return data;
        const tasks = existing
          ? data.tasks.map((t) => (t._id === task._id ? task : t))
          : [...data.tasks, task];
        return { ...data, tasks };
      });
    }

    function onTaskDeleted(payload: EntityDeletedPayload) {
      withBoardData((data) => ({
        ...data,
        tasks: data.tasks.filter((t) => t._id !== payload._id),
      }));
    }

    function upsertColumn(column: Column) {
      withBoardData((data) => {
        const existing = data.columns.find((c) => c._id === column._id);
        if (isStale(existing, column)) return data;
        const columns = existing
          ? data.columns.map((c) => (c._id === column._id ? column : c))
          : [...data.columns, column];
        return { ...data, columns };
      });
    }

    function onColumnDeleted(payload: EntityDeletedPayload) {
      withBoardData((data) => ({
        ...data,
        columns: data.columns.filter((c) => c._id !== payload._id),
        tasks: data.tasks.filter((t) => t.columnId !== payload._id),
      }));
    }

    function onBoardUpdated(board: Board) {
      withBoardData((data) => (isStale(data.board, board) ? data : { ...data, board }));
    }

    function onBoardDeleted() {
      queryClient.removeQueries({ queryKey });
    }

    function handleConnect() {
      socket.emit('board:join', boardId);
      void queryClient.invalidateQueries({ queryKey });
    }

    socket.on('connect', handleConnect);
    socket.on('task:created', upsertTask);
    socket.on('task:updated', upsertTask);
    socket.on('task:moved', upsertTask);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('column:created', upsertColumn);
    socket.on('column:updated', upsertColumn);
    socket.on('column:deleted', onColumnDeleted);
    socket.on('board:updated', onBoardUpdated);
    socket.on('board:deleted', onBoardDeleted);

    if (socket.connected) {
      socket.emit('board:join', boardId);
    } else {
      socket.connect();
    }

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('connect', handleConnect);
      socket.off('task:created', upsertTask);
      socket.off('task:updated', upsertTask);
      socket.off('task:moved', upsertTask);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('column:created', upsertColumn);
      socket.off('column:updated', upsertColumn);
      socket.off('column:deleted', onColumnDeleted);
      socket.off('board:updated', onBoardUpdated);
      socket.off('board:deleted', onBoardDeleted);
    };
  }, [boardId, queryClient]);
}

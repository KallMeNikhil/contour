import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as boardsApi from '../../services/api/boards';
import * as columnsApi from '../../services/api/columns';
import * as tasksApi from '../../services/api/tasks';
import { workspaceKeys } from '../workspace/hooks';
import type {
  CreateTaskPayload,
  UpdateTaskContentPayload,
  MoveTaskPayload,
} from '../../services/api/tasks';
import type { BoardFull, BoardLabel } from '../../services/api/types';

export const boardKeys = {
  full: (boardId: string) => ['boards', boardId, 'full'] as const,
};

export function useBoardFull(boardId: string) {
  return useQuery({
    queryKey: boardKeys.full(boardId),
    queryFn: () => boardsApi.getBoardFull(boardId),
  });
}

function useInvalidateBoard(boardId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: boardKeys.full(boardId) });
}

export function useRenameBoard(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: (name: string) => boardsApi.renameBoard(boardId, name),
    onSuccess: invalidate,
  });
}

export function useDeleteBoard(workspaceId: string, boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => boardsApi.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: boardKeys.full(boardId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.boards(workspaceId) });
    },
  });
}

export function useUpdateBoardLabels(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: (labels: Pick<BoardLabel, 'name' | 'color'>[]) =>
      boardsApi.updateBoardLabels(boardId, labels),
    onSuccess: invalidate,
  });
}

export function useCreateColumn(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: (name: string) => columnsApi.createColumn(boardId, name),
    onSuccess: invalidate,
  });
}

export function useRenameColumn(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      columnsApi.renameColumn(columnId, name),
    onSuccess: invalidate,
  });
}

export function useDeleteColumn(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: (columnId: string) => columnsApi.deleteColumn(columnId),
    onSuccess: invalidate,
  });
}

interface MoveColumnMutationContext {
  previous?: BoardFull;
  columnId: string;
  seq: number;
}

export function useMoveColumn(boardId: string) {
  const queryClient = useQueryClient();
  const seqRef = useRef<Record<string, number>>({});

  return useMutation<
    Awaited<ReturnType<typeof columnsApi.moveColumn>>,
    unknown,
    { columnId: string; payload: columnsApi.MoveColumnPayload },
    MoveColumnMutationContext
  >({
    mutationFn: ({ columnId, payload }) => columnsApi.moveColumn(columnId, payload),
    onMutate: async ({ columnId, payload }) => {
      const seq = (seqRef.current[columnId] ?? 0) + 1;
      seqRef.current[columnId] = seq;

      await queryClient.cancelQueries({ queryKey: boardKeys.full(boardId) });
      const previous = queryClient.getQueryData<BoardFull>(boardKeys.full(boardId));

      if (previous) {
        const before = payload.beforeColumnId
          ? previous.columns.find((c) => c._id === payload.beforeColumnId)
          : undefined;
        const after = payload.afterColumnId
          ? previous.columns.find((c) => c._id === payload.afterColumnId)
          : undefined;
        const position = optimisticPosition(before?.position, after?.position);

        queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), {
          ...previous,
          columns: previous.columns.map((c) => (c._id === columnId ? { ...c, position } : c)),
        });
      }

      return { previous, columnId, seq };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      if (seqRef.current[context.columnId] !== context.seq) return;
      if (context.previous) {
        queryClient.setQueryData(boardKeys.full(boardId), context.previous);
      }
    },
    onSuccess: (serverColumn, _vars, context) => {
      if (context && seqRef.current[context.columnId] !== context.seq) return;
      queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), (current) => {
        if (!current) return current;
        return {
          ...current,
          columns: current.columns.map((c) => (c._id === serverColumn._id ? serverColumn : c)),
        };
      });
    },
  });
}

export function useCreateTask(boardId: string) {
  const invalidate = useInvalidateBoard(boardId);
  return useMutation({
    mutationFn: ({ columnId, payload }: { columnId: string; payload: CreateTaskPayload }) =>
      tasksApi.createTask(columnId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskContentPayload }) =>
      tasksApi.updateTask(taskId, payload),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), (current) => {
        if (!current) return current;
        return {
          ...current,
          tasks: current.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
        };
      });
    },
  });
}

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), (current) => {
        if (!current) return current;
        return { ...current, tasks: current.tasks.filter((t) => t._id !== taskId) };
      });
    },
  });
}

function optimisticPosition(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return after! / 2;
  if (after === undefined) return before + 1000;
  return before + (after - before) / 2;
}

interface MoveMutationContext {
  previous?: BoardFull;
  taskId: string;
  seq: number;
}

export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();
  const seqRef = useRef<Record<string, number>>({});

  return useMutation<
    Awaited<ReturnType<typeof tasksApi.moveTask>>,
    unknown,
    { taskId: string; payload: MoveTaskPayload },
    MoveMutationContext
  >({
    mutationFn: ({ taskId, payload }) => tasksApi.moveTask(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      const seq = (seqRef.current[taskId] ?? 0) + 1;
      seqRef.current[taskId] = seq;

      await queryClient.cancelQueries({ queryKey: boardKeys.full(boardId) });
      const previous = queryClient.getQueryData<BoardFull>(boardKeys.full(boardId));

      if (previous) {
        const before = payload.beforeTaskId
          ? previous.tasks.find((t) => t._id === payload.beforeTaskId)
          : undefined;
        const after = payload.afterTaskId
          ? previous.tasks.find((t) => t._id === payload.afterTaskId)
          : undefined;
        const position = optimisticPosition(before?.position, after?.position);

        queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), {
          ...previous,
          tasks: previous.tasks.map((t) =>
            t._id === taskId ? { ...t, columnId: payload.columnId, position } : t,
          ),
        });
      }

      return { previous, taskId, seq };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      if (seqRef.current[context.taskId] !== context.seq) return;
      if (context.previous) {
        queryClient.setQueryData(boardKeys.full(boardId), context.previous);
      }
    },
    onSuccess: (serverTask, _vars, context) => {
      if (context && seqRef.current[context.taskId] !== context.seq) return;
      queryClient.setQueryData<BoardFull>(boardKeys.full(boardId), (current) => {
        if (!current) return current;
        return {
          ...current,
          tasks: current.tasks.map((t) => (t._id === serverTask._id ? serverTask : t)),
        };
      });
    },
  });
}

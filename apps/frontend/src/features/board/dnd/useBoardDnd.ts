import { useMemo, useRef, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Column, Task } from '../../../services/api/types';
import { useMoveTask } from '../hooks';
import { useToast } from '../../../state/toast';
import { useAnnouncer } from '../../../state/announcer';
import {
  buildColumnOrder,
  moveWithinOrder,
  resolveMovePayload,
  withoutTask,
  type ColumnOrderMap,
} from './ordering';

export function columnDropId(columnId: string): string {
  return `column-drop:${columnId}`;
}

interface DragItemData {
  type: 'task';
  columnId: string;
}

function isColumnDropId(id: string): string | null {
  return id.startsWith('column-drop:') ? id.slice('column-drop:'.length) : null;
}

function isColumnDrag(event: { active: { data: { current?: unknown } } }): boolean {
  return (event.active.data.current as { type?: string } | undefined)?.type === 'column';
}

function columnIdOf(
  id: string,
  order: ColumnOrderMap,
  overData: DragItemData | undefined,
): string | undefined {
  const dropColumnId = isColumnDropId(id);
  if (dropColumnId) return dropColumnId;
  if (overData?.type === 'task') return overData.columnId;

  return Object.keys(order).find((columnId) => order[columnId].includes(id));
}

interface UseBoardDndArgs {
  boardId: string;
  columns: Column[];
  tasksByColumn: Map<string, Task[]>;
  canEdit: boolean;
}

export function useBoardDnd({ boardId, columns, tasksByColumn, canEdit }: UseBoardDndArgs) {
  const moveMutation = useMoveTask(boardId);
  const { showToast } = useToast();
  const { announce } = useAnnouncer();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<ColumnOrderMap | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  const originOrderRef = useRef<ColumnOrderMap>({});

  const serverOrder = useMemo(() => buildColumnOrder(tasksByColumn), [tasksByColumn]);
  const columnIds = useMemo(() => columns.map((c) => c._id), [columns]);
  const taskLookup = useMemo(() => {
    const map = new Map<string, Task>();
    for (const list of tasksByColumn.values()) {
      for (const task of list) map.set(task._id, task);
    }
    return map;
  }, [tasksByColumn]);

  const activeTask = activeTaskId ? (taskLookup.get(activeTaskId) ?? null) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = (args) => closestCorners(args);

  function resetDragState() {
    setActiveTaskId(null);
    setDragOrder(null);
  }

  function applyDragTarget(activeId: string, event: DragOverEvent | DragEndEvent): ColumnOrderMap {
    const base = dragOrder ?? originOrderRef.current;
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return base;

    const overData = event.over?.data.current as DragItemData | undefined;
    const toColumnId = columnIdOf(overId, base, overData);
    const fromColumnId = Object.keys(base).find((c) => base[c].includes(activeId)) ?? toColumnId;
    if (!toColumnId || !fromColumnId) return base;

    const targetIds = withoutTask(base[toColumnId] ?? [], activeId);
    const overIndex = targetIds.indexOf(overId);
    const toIndex = overIndex === -1 ? targetIds.length : overIndex;

    const next = moveWithinOrder(base, activeId, fromColumnId, toColumnId, toIndex);
    setDragOrder(next);
    return next;
  }

  function handleDragStart(event: DragStartEvent) {
    if (!canEdit || isColumnDrag(event)) return;
    const id = String(event.active.id);
    originOrderRef.current = serverOrder;
    setActiveTaskId(id);
    setDragOrder(serverOrder);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!canEdit || !activeTaskId || isColumnDrag(event)) return;
    applyDragTarget(String(event.active.id), event);
  }

  function handleDragCancel() {
    resetDragState();
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isColumnDrag(event)) return;
    if (!canEdit) {
      resetDragState();
      return;
    }
    const activeId = String(event.active.id);
    const origin = originOrderRef.current;

    if (!event.over) {
      resetDragState();
      return;
    }

    const finalOrder = applyDragTarget(activeId, event);
    const fromColumnId = Object.keys(origin).find((c) => origin[c].includes(activeId));
    const toColumnId =
      Object.keys(finalOrder).find((c) => finalOrder[c].includes(activeId)) ?? fromColumnId;

    resetDragState();

    if (!toColumnId || !fromColumnId) return;

    const payload = resolveMovePayload(finalOrder, activeId, toColumnId);
    const originalPayload = resolveMovePayload(origin, activeId, fromColumnId);
    const isNoOp =
      payload.columnId === originalPayload.columnId &&
      payload.beforeTaskId === originalPayload.beforeTaskId &&
      payload.afterTaskId === originalPayload.afterTaskId;
    if (isNoOp) return;

    const task = taskLookup.get(activeId);
    const targetColumn = columns.find((c) => c._id === toColumnId);

    setPendingTaskIds((prev) => new Set(prev).add(activeId));
    moveMutation.mutate(
      { taskId: activeId, payload },
      {
        onSettled: () => {
          setPendingTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(activeId);
            return next;
          });
        },
        onSuccess: () => {
          if (targetColumn && task) {
            const positionInColumn = (finalOrder[toColumnId] ?? []).indexOf(activeId) + 1;
            const total = (finalOrder[toColumnId] ?? []).length;
            announce(
              `Task "${task.title}" moved to ${targetColumn.name}, position ${positionInColumn} of ${total}.`,
            );
          }
        },
        onError: () => {
          showToast("Couldn't move the task - it was returned to its original spot.", {
            tone: 'error',
            actionLabel: 'Retry',
            onAction: () => {
              setPendingTaskIds((prev) => new Set(prev).add(activeId));
              moveMutation.mutate(
                { taskId: activeId, payload },
                {
                  onSettled: () =>
                    setPendingTaskIds((prev) => {
                      const next = new Set(prev);
                      next.delete(activeId);
                      return next;
                    }),
                },
              );
            },
          });
          announce(
            `Move failed. "${task?.title ?? 'Task'}" was returned to its original position.`,
          );
        },
      },
    );
  }

  const effectiveOrder = dragOrder ?? serverOrder;

  return {
    sensors,
    collisionDetection,
    columnIds,
    effectiveOrder,
    activeTask,
    isDragging: activeTaskId !== null,
    pendingTaskIds,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

import { useMemo, useRef, useState } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Column } from '../../../services/api/types';
import { useMoveColumn } from '../hooks';
import { useToast } from '../../../state/toast';
import { useAnnouncer } from '../../../state/announcer';
import {
  moveColumnWithinOrder,
  resolveColumnMovePayload,
  siblingIndexForOver,
} from './columnOrdering';

interface ColumnDragData {
  type: 'column';
}

function isColumnDrag(event: { active: { data: { current?: unknown } } }): boolean {
  return (event.active.data.current as ColumnDragData | undefined)?.type === 'column';
}

interface UseColumnDndArgs {
  boardId: string;
  columns: Column[];
  canEdit: boolean;
}

export function useColumnDnd({ boardId, columns, canEdit }: UseColumnDndArgs) {
  const moveMutation = useMoveColumn(boardId);
  const { showToast } = useToast();
  const { announce } = useAnnouncer();

  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [pendingColumnIds, setPendingColumnIds] = useState<Set<string>>(new Set());

  const originOrderRef = useRef<string[]>([]);

  const serverOrder = useMemo(() => columns.map((c) => c._id), [columns]);
  const columnLookup = useMemo(() => new Map(columns.map((c) => [c._id, c] as const)), [columns]);

  const activeColumn = activeColumnId ? (columnLookup.get(activeColumnId) ?? null) : null;
  const effectiveOrder = dragOrder ?? serverOrder;

  function resetDragState() {
    setActiveColumnId(null);
    setDragOrder(null);
  }

  function handleDragStart(event: DragStartEvent) {
    if (!canEdit || !isColumnDrag(event)) return;
    originOrderRef.current = serverOrder;
    setActiveColumnId(String(event.active.id));
    setDragOrder(serverOrder);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!canEdit || !activeColumnId || !isColumnDrag(event)) return;
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;
    const base = dragOrder ?? originOrderRef.current;
    const activeId = String(event.active.id);
    const toIndex = siblingIndexForOver(base, activeId, overId);
    setDragOrder(moveColumnWithinOrder(base, activeId, toIndex));
  }

  function handleDragCancel() {
    if (activeColumnId) resetDragState();
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!activeColumnId || !isColumnDrag(event)) return;

    const activeId = String(event.active.id);
    const origin = originOrderRef.current;

    if (!event.over) {
      resetDragState();
      return;
    }

    const overId = String(event.over.id);
    const base = dragOrder ?? origin;
    const toIndex = siblingIndexForOver(base, activeId, overId);
    const finalOrder = moveColumnWithinOrder(base, activeId, toIndex);

    resetDragState();

    const payload = resolveColumnMovePayload(finalOrder, activeId);
    const originalPayload = resolveColumnMovePayload(origin, activeId);
    const isNoOp =
      payload.beforeColumnId === originalPayload.beforeColumnId &&
      payload.afterColumnId === originalPayload.afterColumnId;
    if (isNoOp) return;

    const column = columnLookup.get(activeId);

    setPendingColumnIds((prev) => new Set(prev).add(activeId));
    moveMutation.mutate(
      { columnId: activeId, payload },
      {
        onSettled: () => {
          setPendingColumnIds((prev) => {
            const next = new Set(prev);
            next.delete(activeId);
            return next;
          });
        },
        onSuccess: () => {
          if (column) {
            const positionInBoard = finalOrder.indexOf(activeId) + 1;
            announce(
              `Column "${column.name}" moved to position ${positionInBoard} of ${finalOrder.length}.`,
            );
          }
        },
        onError: () => {
          showToast("Couldn't move the column - it was returned to its original position.", {
            tone: 'error',
            actionLabel: 'Retry',
            onAction: () => {
              setPendingColumnIds((prev) => new Set(prev).add(activeId));
              moveMutation.mutate(
                { columnId: activeId, payload },
                {
                  onSettled: () =>
                    setPendingColumnIds((prev) => {
                      const next = new Set(prev);
                      next.delete(activeId);
                      return next;
                    }),
                },
              );
            },
          });
          announce(
            `Move failed. "${column?.name ?? 'Column'}" was returned to its original position.`,
          );
        },
      },
    );
  }

  return {
    columnOrder: effectiveOrder,
    activeColumn,
    isDraggingColumn: activeColumnId !== null,
    pendingColumnIds,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

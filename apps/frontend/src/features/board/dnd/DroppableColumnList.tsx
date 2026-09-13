import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { columnDropId } from './useBoardDnd';

interface DroppableColumnListProps {
  columnId: string;
  taskIds: string[];
  isEmpty: boolean;
  emptyLabel: ReactNode;
  children: ReactNode;
}

export function DroppableColumnList({
  columnId,
  taskIds,
  isEmpty,
  emptyLabel,
  children,
}: DroppableColumnListProps) {
  const { setNodeRef } = useDroppable({
    id: columnDropId(columnId),
    data: { type: 'column', columnId },
  });

  return (
    <SortableContext id={columnId} items={taskIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className="flex min-h-[3rem] flex-1 flex-col">
        {isEmpty ? (
          <div className="rounded-lg border border-dashed border-border-default/60 px-3 py-6 text-center text-meta italic text-muted">
            {emptyLabel}
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">{children}</ul>
        )}
      </div>
    </SortableContext>
  );
}

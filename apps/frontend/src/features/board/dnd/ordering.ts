export interface Neighbors {
  beforeTaskId?: string;

  afterTaskId?: string;
}

export type ColumnOrderMap = Record<string, string[]>;

export function withoutTask(ids: string[], taskId: string): string[] {
  return ids.filter((id) => id !== taskId);
}

export function neighborsForInsertion(siblingIds: string[], insertIndex: number): Neighbors {
  const clamped = Math.max(0, Math.min(insertIndex, siblingIds.length));
  const beforeTaskId = clamped > 0 ? siblingIds[clamped - 1] : undefined;
  const afterTaskId = clamped < siblingIds.length ? siblingIds[clamped] : undefined;
  return { beforeTaskId, afterTaskId };
}

export function buildColumnOrder(tasksByColumn: Map<string, { _id: string }[]>): ColumnOrderMap {
  const order: ColumnOrderMap = {};
  for (const [columnId, tasks] of tasksByColumn) {
    order[columnId] = tasks.map((t) => t._id);
  }
  return order;
}

export function moveWithinOrder(
  order: ColumnOrderMap,
  activeId: string,
  fromColumnId: string,
  toColumnId: string,
  toIndex: number,
): ColumnOrderMap {
  const next: ColumnOrderMap = { ...order };

  next[fromColumnId] = withoutTask(order[fromColumnId] ?? [], activeId);

  const targetSource = fromColumnId === toColumnId ? next[fromColumnId] : (order[toColumnId] ?? []);
  const targetIds = withoutTask(targetSource, activeId);
  const clamped = Math.max(0, Math.min(toIndex, targetIds.length));
  const withInsertion = [...targetIds];
  withInsertion.splice(clamped, 0, activeId);
  next[toColumnId] = withInsertion;

  return next;
}

export function resolveMovePayload(
  order: ColumnOrderMap,
  activeId: string,
  toColumnId: string,
): { columnId: string; beforeTaskId?: string; afterTaskId?: string } {
  const finalIds = order[toColumnId] ?? [];
  const index = finalIds.indexOf(activeId);
  const siblingIds = withoutTask(finalIds, activeId);
  const insertIndex = index === -1 ? siblingIds.length : index;
  const neighbors = neighborsForInsertion(siblingIds, insertIndex);
  return { columnId: toColumnId, ...neighbors };
}

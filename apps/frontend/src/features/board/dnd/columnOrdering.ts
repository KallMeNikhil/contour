import { neighborsForInsertion, withoutTask as withoutId, type Neighbors } from './ordering';

export function siblingIndexForOver(order: string[], activeId: string, overId: string): number {
  const siblingIds = withoutId(order, activeId);
  const idx = siblingIds.indexOf(overId);
  return idx === -1 ? siblingIds.length : idx;
}

export function moveColumnWithinOrder(
  order: string[],
  activeId: string,
  toIndex: number,
): string[] {
  const withoutActive = withoutId(order, activeId);
  const clamped = Math.max(0, Math.min(toIndex, withoutActive.length));
  const next = [...withoutActive];
  next.splice(clamped, 0, activeId);
  return next;
}

export function resolveColumnMovePayload(
  order: string[],
  activeId: string,
): { beforeColumnId?: string; afterColumnId?: string } {
  const index = order.indexOf(activeId);
  const siblingIds = withoutId(order, activeId);
  const insertIndex = index === -1 ? siblingIds.length : index;
  const neighbors: Neighbors = neighborsForInsertion(siblingIds, insertIndex);
  return { beforeColumnId: neighbors.beforeTaskId, afterColumnId: neighbors.afterTaskId };
}

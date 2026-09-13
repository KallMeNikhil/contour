import { columnRepository } from '../repositories/ColumnRepository.js';
import { taskRepository } from '../repositories/TaskRepository.js';
import { computePosition, rebalancedPositions } from './ordering.js';
import { NotFoundError, InvariantViolationError, ValidationError } from '../errors/AppError.js';
import type { HydratedDocument, Types } from 'mongoose';
import type { ColumnDoc } from '../models/Column.js';

type ColumnHydrated = HydratedDocument<ColumnDoc>;

function idStr(id: Types.ObjectId | string): string {
  return id.toString();
}

export async function createColumn(boardId: string, name: string) {
  const position = await columnRepository.nextPosition(boardId);
  return columnRepository.create({ boardId, name, position });
}

export async function getColumnById(columnId: string): Promise<HydratedDocument<ColumnDoc>> {
  const column = await columnRepository.findById(columnId);
  if (!column) throw new NotFoundError('Column not found');
  return column;
}

export async function updateColumn(columnId: string, name: string) {
  const updated = await columnRepository.updateName(columnId, name);
  if (!updated) throw new NotFoundError('Column not found');
  return updated;
}

export async function deleteColumn(columnId: Types.ObjectId | string): Promise<void> {
  await taskRepository.deleteByColumn(columnId);
  const deleted = await columnRepository.deleteById(columnId.toString());
  if (!deleted) throw new NotFoundError('Column not found');
}

export interface MoveColumnInput {
  beforeColumnId?: string;
  afterColumnId?: string;
}

export async function moveColumn(
  columnId: string,
  input: MoveColumnInput,
): Promise<ColumnHydrated> {
  const column = await columnRepository.findById(columnId);
  if (!column) throw new NotFoundError('Column not found');

  if (input.beforeColumnId && input.beforeColumnId === columnId) {
    throw new ValidationError('A column cannot be its own neighbor');
  }
  if (input.afterColumnId && input.afterColumnId === columnId) {
    throw new ValidationError('A column cannot be its own neighbor');
  }

  const neighborIds = [input.beforeColumnId, input.afterColumnId].filter(
    (v): v is string => v !== undefined,
  );
  const neighbors = await columnRepository.findManyByIds(neighborIds);
  const neighborMap = new Map(neighbors.map((n) => [idStr(n._id as Types.ObjectId), n]));

  let beforeColumn: ColumnHydrated | undefined;
  let afterColumn: ColumnHydrated | undefined;

  if (input.beforeColumnId) {
    const candidate = neighborMap.get(input.beforeColumnId);
    if (!candidate || idStr(candidate.boardId) !== idStr(column.boardId)) {
      throw new InvariantViolationError(
        'beforeColumnId does not refer to a column on the same board',
      );
    }
    beforeColumn = candidate;
  }
  if (input.afterColumnId) {
    const candidate = neighborMap.get(input.afterColumnId);
    if (!candidate || idStr(candidate.boardId) !== idStr(column.boardId)) {
      throw new InvariantViolationError(
        'afterColumnId does not refer to a column on the same board',
      );
    }
    afterColumn = candidate;
  }
  if (beforeColumn && afterColumn && !(beforeColumn.position < afterColumn.position)) {
    throw new InvariantViolationError(
      'beforeColumnId and afterColumnId are not adjacent in the requested order',
    );
  }

  const { position, needsRebalance } = computePosition({
    before: beforeColumn?.position,
    after: afterColumn?.position,
  });

  if (!needsRebalance) {
    const updated = await columnRepository.updatePosition(columnId, position);
    if (!updated) throw new NotFoundError('Column not found');
    return updated;
  }

  await rebalanceColumnsWithMove(column, input);
  const result = await columnRepository.findById(columnId);
  if (!result) throw new NotFoundError('Column not found');
  return result;
}

async function rebalanceColumnsWithMove(
  column: ColumnHydrated,
  input: MoveColumnInput,
): Promise<void> {
  const siblings = await columnRepository.listByBoard(column.boardId);
  const others = siblings.filter(
    (s) => idStr(s._id as Types.ObjectId) !== idStr(column._id as Types.ObjectId),
  );

  let insertIndex = others.length;
  if (input.beforeColumnId) {
    const idx = others.findIndex((o) => idStr(o._id as Types.ObjectId) === input.beforeColumnId);
    insertIndex = idx + 1;
  } else if (input.afterColumnId) {
    const idx = others.findIndex((o) => idStr(o._id as Types.ObjectId) === input.afterColumnId);
    insertIndex = idx;
  }

  const ordered = [...others];
  ordered.splice(insertIndex, 0, column);

  const positions = rebalancedPositions(ordered.length);
  await columnRepository.bulkSetPositions(
    ordered.map((c, i) => ({ id: c._id as Types.ObjectId, position: positions[i] })),
  );
}

import { taskRepository } from '../repositories/TaskRepository.js';
import { columnRepository } from '../repositories/ColumnRepository.js';
import { boardRepository } from '../repositories/BoardRepository.js';
import { workspaceMembershipRepository } from '../repositories/WorkspaceMembershipRepository.js';
import { computePosition, rebalancedPositions } from './ordering.js';
import {
  NotFoundError,
  ConflictError,
  InvariantViolationError,
  ValidationError,
} from '../errors/AppError.js';
import type { HydratedDocument, Types } from 'mongoose';
import type { TaskDoc } from '../models/Task.js';
import type { BoardDoc } from '../models/Board.js';

type TaskHydrated = HydratedDocument<TaskDoc>;

function idStr(id: Types.ObjectId | string): string {
  return id.toString();
}

function assertLabelsBelongToBoard(board: HydratedDocument<BoardDoc>, labelIds: string[]): void {
  if (labelIds.length === 0) return;
  const boardLabelIds = new Set(board.labels.map((l) => idStr(l._id as Types.ObjectId)));
  const invalid = labelIds.filter((id) => !boardLabelIds.has(id));
  if (invalid.length > 0) {
    throw new InvariantViolationError('One or more labels do not belong to this board', {
      invalidLabelIds: invalid,
    });
  }
}

async function assertAssigneeIsActiveMember(
  workspaceId: Types.ObjectId | string,
  assigneeId: string,
): Promise<void> {
  const membership = await workspaceMembershipRepository.findActive(workspaceId, assigneeId);
  if (!membership) {
    throw new InvariantViolationError('assignee must be an active member of this workspace');
  }
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
}

export async function createTask(columnId: string, input: CreateTaskInput): Promise<TaskHydrated> {
  const column = await columnRepository.findById(columnId);
  if (!column) throw new NotFoundError('Column not found');
  const board = await boardRepository.findById(column.boardId);
  if (!board) throw new NotFoundError('Board not found');

  const labelIds = input.labelIds ?? [];
  assertLabelsBelongToBoard(board, labelIds);
  if (input.assigneeId) {
    await assertAssigneeIsActiveMember(board.workspaceId, input.assigneeId);
  }

  const position = await taskRepository.nextPosition(column._id);
  return taskRepository.create({
    boardId: column.boardId,
    columnId: column._id,
    title: input.title,
    description: input.description ?? '',
    assigneeId: input.assigneeId ?? null,
    labelIds,
    dueDate: input.dueDate ?? null,
    position,
  });
}

export interface UpdateTaskContentInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
  version: number;
}

export async function updateTaskContent(
  taskId: string,
  input: UpdateTaskContentInput,
): Promise<TaskHydrated> {
  const existing = await taskRepository.findById(taskId);
  if (!existing) throw new NotFoundError('Task not found');

  const board = await boardRepository.findById(existing.boardId);
  if (!board) throw new NotFoundError('Board not found');

  if (input.labelIds !== undefined) {
    assertLabelsBelongToBoard(board, input.labelIds);
  }
  if (input.assigneeId) {
    await assertAssigneeIsActiveMember(board.workspaceId, input.assigneeId);
  }

  const fields: Record<string, unknown> = {};
  if (input.title !== undefined) fields.title = input.title;
  if (input.description !== undefined) fields.description = input.description;
  if (input.assigneeId !== undefined) fields.assigneeId = input.assigneeId;
  if (input.labelIds !== undefined) fields.labelIds = input.labelIds;
  if (input.dueDate !== undefined) fields.dueDate = input.dueDate;

  const updated = await taskRepository.updateContentVersioned(taskId, input.version, fields);
  if (!updated) {
    const stillExists = await taskRepository.findById(taskId);
    if (!stillExists) throw new NotFoundError('Task not found');
    throw new ConflictError('This task was changed elsewhere; refresh and try again', {
      currentVersion: stillExists.version,
    });
  }
  return updated;
}

export async function deleteTask(taskId: string): Promise<void> {
  const deleted = await taskRepository.deleteById(taskId);
  if (!deleted) throw new NotFoundError('Task not found');
}

export interface MoveTaskInput {
  columnId: string;
  beforeTaskId?: string;
  afterTaskId?: string;
}

export async function moveTask(taskId: string, input: MoveTaskInput): Promise<TaskHydrated> {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');

  const targetColumn = await columnRepository.findById(input.columnId);
  if (!targetColumn) throw new NotFoundError('Target column not found');

  if (idStr(targetColumn.boardId) !== idStr(task.boardId)) {
    throw new InvariantViolationError('A task can only move within its own board');
  }

  if (input.beforeTaskId && input.beforeTaskId === taskId) {
    throw new ValidationError('A task cannot be its own neighbor');
  }
  if (input.afterTaskId && input.afterTaskId === taskId) {
    throw new ValidationError('A task cannot be its own neighbor');
  }

  const neighborIds = [input.beforeTaskId, input.afterTaskId].filter(
    (v): v is string => v !== undefined,
  );
  const neighbors = await taskRepository.findManyByIds(neighborIds);
  const neighborMap = new Map(neighbors.map((n) => [idStr(n._id as Types.ObjectId), n]));

  let beforeTask: TaskHydrated | undefined;
  let afterTask: TaskHydrated | undefined;

  if (input.beforeTaskId) {
    const candidate = neighborMap.get(input.beforeTaskId);
    if (!candidate || idStr(candidate.columnId) !== input.columnId) {
      throw new InvariantViolationError(
        'beforeTaskId does not refer to a task in the target column',
      );
    }
    beforeTask = candidate;
  }
  if (input.afterTaskId) {
    const candidate = neighborMap.get(input.afterTaskId);
    if (!candidate || idStr(candidate.columnId) !== input.columnId) {
      throw new InvariantViolationError(
        'afterTaskId does not refer to a task in the target column',
      );
    }
    afterTask = candidate;
  }
  if (beforeTask && afterTask && !(beforeTask.position < afterTask.position)) {
    throw new InvariantViolationError(
      'beforeTaskId and afterTaskId are not adjacent in the requested order',
    );
  }

  const { position, needsRebalance } = computePosition({
    before: beforeTask?.position,
    after: afterTask?.position,
  });

  if (!needsRebalance) {
    const updated = await taskRepository.updatePosition(taskId, {
      columnId: targetColumn._id,
      boardId: task.boardId,
      position,
    });
    if (!updated) throw new NotFoundError('Task not found');
    return updated;
  }

  await rebalanceColumnWithMove(task, targetColumn._id, task.boardId, input);
  const result = await taskRepository.findById(taskId);
  if (!result) throw new NotFoundError('Task not found');
  return result;
}

async function rebalanceColumnWithMove(
  task: TaskHydrated,
  targetColumnId: Types.ObjectId,
  boardId: Types.ObjectId,
  input: MoveTaskInput,
): Promise<void> {
  const siblings = await taskRepository.listByColumn(targetColumnId);
  const others = siblings.filter(
    (s) => idStr(s._id as Types.ObjectId) !== idStr(task._id as Types.ObjectId),
  );

  let insertIndex = others.length;
  if (input.beforeTaskId) {
    const idx = others.findIndex((o) => idStr(o._id as Types.ObjectId) === input.beforeTaskId);
    insertIndex = idx + 1;
  } else if (input.afterTaskId) {
    const idx = others.findIndex((o) => idStr(o._id as Types.ObjectId) === input.afterTaskId);
    insertIndex = idx;
  }

  const ordered = [...others];
  ordered.splice(insertIndex, 0, task);

  const positions = rebalancedPositions(ordered.length);
  const movedIdStr = idStr(task._id as Types.ObjectId);

  await taskRepository.bulkSetPositions(
    ordered.map((t, i) => {
      const tId = idStr(t._id as Types.ObjectId);
      return {
        id: t._id as Types.ObjectId,
        position: positions[i],
        ...(tId === movedIdStr ? { columnId: targetColumnId, boardId } : {}),
      };
    }),
  );
}

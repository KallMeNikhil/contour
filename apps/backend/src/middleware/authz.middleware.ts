import type { NextFunction, Request, Response } from 'express';
import { UnauthenticatedError, NotFoundError } from '../errors/AppError.js';
import { assertWorkspaceRole, type WorkspaceRole } from '../services/membership.service.js';
import { boardRepository } from '../repositories/BoardRepository.js';
import { columnRepository } from '../repositories/ColumnRepository.js';
import { taskRepository } from '../repositories/TaskRepository.js';

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthenticatedError();
  return req.user.id;
}

export function requireWorkspaceRole(minRole: WorkspaceRole, paramName = 'id') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = requireUserId(req);
      const workspaceId = req.params[paramName];
      req.membership = await assertWorkspaceRole(userId, workspaceId, minRole);
      req.workspaceId = workspaceId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireBoardRole(minRole: WorkspaceRole, paramName = 'id') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = requireUserId(req);
      const boardId = req.params[paramName];
      const board = await boardRepository.findById(boardId);
      if (!board) throw new NotFoundError('Board not found');
      req.membership = await assertWorkspaceRole(userId, board.workspaceId, minRole);
      req.board = board;
      req.workspaceId = board.workspaceId.toString();
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireColumnRole(minRole: WorkspaceRole, paramName = 'id') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = requireUserId(req);
      const columnId = req.params[paramName];
      const column = await columnRepository.findById(columnId);
      if (!column) throw new NotFoundError('Column not found');
      const board = await boardRepository.findById(column.boardId);
      if (!board) throw new NotFoundError('Board not found');
      req.membership = await assertWorkspaceRole(userId, board.workspaceId, minRole);
      req.column = column;
      req.board = board;
      req.workspaceId = board.workspaceId.toString();
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireTaskRole(minRole: WorkspaceRole, paramName = 'id') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = requireUserId(req);
      const taskId = req.params[paramName];
      const task = await taskRepository.findById(taskId);
      if (!task) throw new NotFoundError('Task not found');
      const board = await boardRepository.findById(task.boardId);
      if (!board) throw new NotFoundError('Board not found');
      req.membership = await assertWorkspaceRole(userId, board.workspaceId, minRole);
      req.task = task;
      req.board = board;
      req.workspaceId = board.workspaceId.toString();
      next();
    } catch (err) {
      next(err);
    }
  };
}

import { boardRepository } from '../repositories/BoardRepository.js';
import { columnRepository } from '../repositories/ColumnRepository.js';
import { taskRepository } from '../repositories/TaskRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import type { HydratedDocument, Types } from 'mongoose';
import type { BoardDoc } from '../models/Board.js';

export async function createBoard(workspaceId: string, name: string) {
  return boardRepository.create({ workspaceId, name });
}

export async function listBoardsForWorkspace(workspaceId: string) {
  return boardRepository.listByWorkspace(workspaceId);
}

export async function getBoardById(boardId: string): Promise<HydratedDocument<BoardDoc>> {
  const board = await boardRepository.findById(boardId);
  if (!board) throw new NotFoundError('Board not found');
  return board;
}

export async function getBoardFull(boardId: string) {
  const board = await getBoardById(boardId);
  const columns = await columnRepository.listByBoard(board._id);
  const tasks = await taskRepository.listByBoard(board._id);
  return { board, columns, tasks };
}

export async function updateBoard(
  boardId: string,
  fields: { name?: string; labels?: { name: string; color: string }[] },
) {
  const updated = await boardRepository.updateFields(boardId, fields);
  if (!updated) throw new NotFoundError('Board not found');
  return updated;
}

export async function deleteBoard(boardId: Types.ObjectId | string): Promise<void> {
  await taskRepository.deleteByBoard(boardId);
  await columnRepository.deleteByBoard(boardId);
  const deleted = await boardRepository.deleteById(boardId.toString());
  if (!deleted) throw new NotFoundError('Board not found');
}

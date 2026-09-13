import type { Request, Response } from 'express';
import * as boardService from '../services/board.service.js';
import { emitToBoard, getIO } from '../realtime/socket.js';

export async function listBoardsHandler(req: Request, res: Response): Promise<void> {
  const boards = await boardService.listBoardsForWorkspace(req.params.id);
  res.json(boards);
}

export async function createBoardHandler(req: Request, res: Response): Promise<void> {
  const board = await boardService.createBoard(req.params.id, req.body.name);
  res.status(201).json(board);
}

export async function getBoardFullHandler(req: Request, res: Response): Promise<void> {
  const { board, columns, tasks } = await boardService.getBoardFull(req.params.id);
  res.json({ board, columns, tasks });
}

export async function updateBoardHandler(req: Request, res: Response): Promise<void> {
  const board = await boardService.updateBoard(req.params.id, req.body);
  res.json(board);
  emitToBoard(getIO(req), board._id.toString(), 'board:updated', board);
}

export async function deleteBoardHandler(req: Request, res: Response): Promise<void> {
  const boardId = req.params.id;
  await boardService.deleteBoard(boardId);
  res.status(204).send();
  emitToBoard(getIO(req), boardId, 'board:deleted', { _id: boardId });
}

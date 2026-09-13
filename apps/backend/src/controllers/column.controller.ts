import type { Request, Response } from 'express';
import * as columnService from '../services/column.service.js';
import { emitToBoard, getIO } from '../realtime/socket.js';

export async function createColumnHandler(req: Request, res: Response): Promise<void> {
  const column = await columnService.createColumn(req.params.id, req.body.name);
  res.status(201).json(column);
  emitToBoard(getIO(req), column.boardId.toString(), 'column:created', column);
}

export async function getColumnHandler(req: Request, res: Response): Promise<void> {
  res.json(req.column);
}

export async function updateColumnHandler(req: Request, res: Response): Promise<void> {
  const column = await columnService.updateColumn(req.params.id, req.body.name);
  res.json(column);
  emitToBoard(getIO(req), column.boardId.toString(), 'column:updated', column);
}

export async function moveColumnHandler(req: Request, res: Response): Promise<void> {
  const column = await columnService.moveColumn(req.params.id, req.body);
  res.json(column);
  emitToBoard(getIO(req), column.boardId.toString(), 'column:updated', column);
}

export async function deleteColumnHandler(req: Request, res: Response): Promise<void> {
  const boardId = req.column?.boardId.toString();
  const columnId = req.params.id;
  await columnService.deleteColumn(columnId);
  res.status(204).send();
  if (boardId) {
    emitToBoard(getIO(req), boardId, 'column:deleted', { _id: columnId, boardId });
  }
}

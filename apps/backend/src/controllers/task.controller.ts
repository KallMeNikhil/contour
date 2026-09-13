import type { Request, Response } from 'express';
import * as taskService from '../services/task.service.js';
import { emitToBoard, getIO } from '../realtime/socket.js';

export async function createTaskHandler(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(req.params.id, req.body);
  res.status(201).json(task);
  emitToBoard(getIO(req), task.boardId.toString(), 'task:created', task);
}

export async function updateTaskHandler(req: Request, res: Response): Promise<void> {
  const task = await taskService.updateTaskContent(req.params.id, req.body);
  res.json(task);
  emitToBoard(getIO(req), task.boardId.toString(), 'task:updated', task);
}

export async function moveTaskHandler(req: Request, res: Response): Promise<void> {
  const task = await taskService.moveTask(req.params.id, req.body);
  res.json(task);
  emitToBoard(getIO(req), task.boardId.toString(), 'task:moved', task);
}

export async function deleteTaskHandler(req: Request, res: Response): Promise<void> {
  const boardId = req.task?.boardId.toString();
  const taskId = req.params.id;
  await taskService.deleteTask(taskId);
  res.status(204).send();
  if (boardId) {
    emitToBoard(getIO(req), boardId, 'task:deleted', { _id: taskId, boardId });
  }
}

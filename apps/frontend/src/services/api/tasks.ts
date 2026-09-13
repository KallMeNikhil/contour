import { apiRequest } from './client';
import type { Task } from './types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
}

export function createTask(columnId: string, payload: CreateTaskPayload): Promise<Task> {
  return apiRequest<Task>(`/columns/${columnId}/tasks`, { method: 'POST', body: payload });
}

export interface UpdateTaskContentPayload {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
  version: number;
}

export function updateTask(taskId: string, payload: UpdateTaskContentPayload): Promise<Task> {
  return apiRequest<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: payload });
}

export function deleteTask(taskId: string): Promise<void> {
  return apiRequest<void>(`/tasks/${taskId}`, { method: 'DELETE' });
}

export interface MoveTaskPayload {
  columnId: string;
  beforeTaskId?: string;
  afterTaskId?: string;
}

export function moveTask(taskId: string, payload: MoveTaskPayload): Promise<Task> {
  return apiRequest<Task>(`/tasks/${taskId}/move`, { method: 'PATCH', body: payload });
}

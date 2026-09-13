import { apiRequest } from './client';
import type { Column } from './types';

export function createColumn(boardId: string, name: string): Promise<Column> {
  return apiRequest<Column>(`/boards/${boardId}/columns`, { method: 'POST', body: { name } });
}

export function renameColumn(columnId: string, name: string): Promise<Column> {
  return apiRequest<Column>(`/columns/${columnId}`, { method: 'PATCH', body: { name } });
}

export function deleteColumn(columnId: string): Promise<void> {
  return apiRequest<void>(`/columns/${columnId}`, { method: 'DELETE' });
}

export interface MoveColumnPayload {
  beforeColumnId?: string;
  afterColumnId?: string;
}

export function moveColumn(columnId: string, payload: MoveColumnPayload): Promise<Column> {
  return apiRequest<Column>(`/columns/${columnId}/move`, { method: 'PATCH', body: payload });
}

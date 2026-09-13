import { apiRequest } from './client';
import type { Board, BoardFull, BoardLabel } from './types';

export function getBoardFull(boardId: string): Promise<BoardFull> {
  return apiRequest<BoardFull>(`/boards/${boardId}/full`);
}

export function renameBoard(boardId: string, name: string): Promise<Board> {
  return apiRequest<Board>(`/boards/${boardId}`, { method: 'PATCH', body: { name } });
}

export function updateBoardLabels(
  boardId: string,
  labels: Pick<BoardLabel, 'name' | 'color'>[],
): Promise<Board> {
  return apiRequest<Board>(`/boards/${boardId}`, { method: 'PATCH', body: { labels } });
}

export function deleteBoard(boardId: string): Promise<void> {
  return apiRequest<void>(`/boards/${boardId}`, { method: 'DELETE' });
}

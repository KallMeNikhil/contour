import type { Server as HttpServer } from 'node:http';
import type { Request } from 'express';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { verifyAccessToken } from '../services/jwt.service.js';
import { assertWorkspaceRole } from '../services/membership.service.js';
import { boardRepository } from '../repositories/BoardRepository.js';

export interface AuthedSocket extends Socket {
  data: {
    userId: string;
  };
}

export function boardRoom(boardId: string): string {
  return `board:${boardId}`;
}

export function initRealtime(httpServer: HttpServer, corsOrigin: string): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigin },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, '') as
          string | undefined);
      if (!token) {
        next(new Error('UNAUTHENTICATED'));
        return;
      }
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    const authed = socket as AuthedSocket;

    socket.on(
      'board:join',
      async (boardId: unknown, ack?: (result: { ok: boolean; error?: string }) => void) => {
        try {
          if (typeof boardId !== 'string' || !boardId) {
            ack?.({ ok: false, error: 'INVALID_BOARD_ID' });
            return;
          }
          const board = await boardRepository.findById(boardId);
          if (!board) {
            ack?.({ ok: false, error: 'NOT_FOUND' });
            return;
          }
          await assertWorkspaceRole(authed.data.userId, board.workspaceId, 'viewer');
          await socket.join(boardRoom(boardId));
          ack?.({ ok: true });
        } catch {
          ack?.({ ok: false, error: 'FORBIDDEN' });
        }
      },
    );

    socket.on('board:leave', (boardId: unknown) => {
      if (typeof boardId === 'string' && boardId) {
        void socket.leave(boardRoom(boardId));
      }
    });
  });

  return io;
}

export function getIO(req: Request): SocketIOServer | undefined {
  return req.app.get('io') as SocketIOServer | undefined;
}

export function emitToBoard(
  io: SocketIOServer | undefined,
  boardId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(boardRoom(boardId)).emit(event, payload);
}

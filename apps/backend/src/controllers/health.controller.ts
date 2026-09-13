import type { Request, Response } from 'express';
import { isDBConnected } from '../config/db.js';

export function getHealth(_req: Request, res: Response): void {
  const dbConnected = isDBConnected();

  const body = {
    status: dbConnected ? ('ok' as const) : ('degraded' as const),
    db: dbConnected ? ('connected' as const) : ('disconnected' as const),
    timestamp: new Date().toISOString(),
  };

  res.status(dbConnected ? 200 : 503).json(body);
}

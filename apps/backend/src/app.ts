import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SHARED_PACKAGE_NAME } from '@contour/shared';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { workspaceRouter } from './routes/workspace.routes.js';
import { boardRouter } from './routes/board.routes.js';
import { columnRouter } from './routes/column.routes.js';
import { taskRouter } from './routes/task.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export interface CreateAppOptions {
  corsOrigin?: string;
}

export function createApp(options: CreateAppOptions = {}) {
  const corsOrigin = options.corsOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));

  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'contour-backend',
      status: 'foundation',
      sharedPackage: SHARED_PACKAGE_NAME,
    });
  });

  app.use(healthRouter);

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/workspaces', workspaceRouter);
  app.use('/api/v1/boards', boardRouter);
  app.use('/api/v1/columns', columnRouter);
  app.use('/api/v1/tasks', taskRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

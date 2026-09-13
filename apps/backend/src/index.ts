import 'dotenv/config';
import http, { type Server } from 'node:http';
import { getConfig, ConfigValidationError } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { initRealtime } from './realtime/socket.js';

async function main(): Promise<void> {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      console.error(err.message);
    } else {
      console.error('Failed to load configuration:', err);
    }
    process.exit(1);
  }

  try {
    await connectDB(config.MONGO_URI);
    console.log('[mongo] connected');
  } catch (err) {
    console.error('[mongo] failed to connect - aborting startup:', err);
    process.exit(1);
  }

  const app = createApp({ corsOrigin: config.CORS_ORIGIN });

  const server = http.createServer(app);
  const io = initRealtime(server, config.CORS_ORIGIN);
  app.set('io', io);

  server.listen(config.PORT, () => {
    console.log(`contour-backend listening on port ${config.PORT} (${config.NODE_ENV})`);
  });

  registerGracefulShutdown(server);
}

function registerGracefulShutdown(server: Server): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] received ${signal}, closing server...`);

    server.close(async (err) => {
      if (err) console.error('[shutdown] error closing HTTP server:', err);
      try {
        await disconnectDB();
        console.log('[shutdown] mongo disconnected, exiting cleanly');
        process.exit(err ? 1 : 0);
      } catch (dbErr) {
        console.error('[shutdown] error disconnecting mongo:', dbErr);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

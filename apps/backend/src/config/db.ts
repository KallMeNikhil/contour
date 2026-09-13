import mongoose from 'mongoose';

let listenersAttached = false;

function attachConnectionListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err instanceof Error ? err.message : err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
}

export interface ConnectOptions {
  serverSelectionTimeoutMS?: number;
}

export async function connectDB(uri: string, options: ConnectOptions = {}): Promise<void> {
  attachConnectionListeners();

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? 5000,
  });
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

export function getDBReadyState(): number {
  return mongoose.connection.readyState;
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

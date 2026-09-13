import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string({ required_error: 'MONGO_URI is required' }).min(1, 'MONGO_URI is required'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),

  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
});

export type AppConfig = z.infer<typeof envSchema>;

export class ConfigValidationError extends Error {
  readonly details: string[];

  constructor(details: string[]) {
    super(`Invalid environment configuration:\n${details.join('\n')}`);
    this.name = 'ConfigValidationError';
    this.details = details;
  }
}

export function loadEnv(source: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map(
      (i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    throw new ConfigValidationError(details);
  }
  return result.data;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (!cached) {
    cached = loadEnv(process.env);
  }
  return cached;
}

export function __resetConfigForTests(): void {
  cached = undefined;
}

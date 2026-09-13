import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 60_000,
    testTimeout: 20_000,
    setupFiles: ['./tests/setup.ts'],
  },
});

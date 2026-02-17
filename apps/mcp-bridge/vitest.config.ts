import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment for Express backend (no DOM needed)
    environment: 'node',

    // Singleton-friendly configuration
    // Run tests sequentially for singleton patterns
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,

    // Setup file for environment variables
    setupFiles: ['./src/test/setup.ts'],

    // Include test files
    include: ['src/**/*.test.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**/*.ts', 'src/index.ts'],
    },

    // Globals for describe, it, expect
    globals: true,
  },
});

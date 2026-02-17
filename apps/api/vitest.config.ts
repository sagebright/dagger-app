import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment for server-side testing
    environment: 'node',

    // Include test files co-located with source
    include: ['src/**/*.test.ts'],

    // Setup file for env vars and global mocks
    setupFiles: ['./src/test/setup.ts'],

    // Globals for describe, it, expect
    globals: true,

    // Sequential execution for singleton patterns (Supabase client, etc.)
    // Vitest 4 moved pool options to top-level `forks` config
    sequence: {
      concurrent: false,
    },

    // Allow passing with zero test files (exits cleanly during scaffold phase)
    passWithNoTests: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**/*.ts',
        'src/index.ts',
      ],
      // Scaffold phase: no source code yet, raise to 70% when routes are implemented
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});

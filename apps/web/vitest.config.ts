import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // jsdom environment for React/DOM testing
      environment: 'jsdom',

      // Include test files
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

      // Setup file for mocks and React cleanup
      setupFiles: ['./src/test/setup.ts'],

      // Globals for describe, it, expect
      globals: true,

      // Allow passing with zero test files during reboot
      passWithNoTests: true,

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/test/**/*.ts',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],
      },
    },
  })
);

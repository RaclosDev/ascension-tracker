/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // Entry points only wire the app together and are exercised by the Playwright suite.
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/sw.ts'],
      // Ratchet: set just under the measured coverage (Nov 2026: 51.0 / 42.0 / 45.7 / 51.7).
      // Raise these as tests are added; never lower them to get a build green.
      thresholds: {
        statements: 50,
        branches: 41,
        functions: 45,
        lines: 51,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});

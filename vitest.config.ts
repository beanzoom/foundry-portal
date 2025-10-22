import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load .env.test file for integration tests
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'SUPABASE_']);

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{js,ts,jsx,tsx}'],
      exclude: ['tests/e2e/**'],
      env: {
        // Make environment variables available to tests
        ...env,
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          '*.config.{js,ts}',
          'dist/',
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

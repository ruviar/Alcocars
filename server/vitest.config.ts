import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Allow tests to import from 'server/src' paths without ../.. chains
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    root: path.resolve(__dirname),
    // Provide a dummy DATABASE_URL so env.ts doesn't process.exit in test runs
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/alocars_test',
      NODE_ENV: 'test',
      PORT: '3001',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-jwt-secret-for-vitest',
    },
    // Run each test file in its own worker for proper module isolation
    isolate: true,
  },
});

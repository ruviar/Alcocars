import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    root: path.resolve(__dirname),
    include: ['src/server/tests/**/*.test.ts'],
    // DATABASE_URL de mentira para que env.ts no aborte en los tests unitarios
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/alcocars_test',
      NODE_ENV: 'test',
      CORS_ORIGIN: 'http://localhost:3000',
      JWT_SECRET: 'test-jwt-secret-for-vitest-min-32-chars',
    },
    isolate: true,
  },
});

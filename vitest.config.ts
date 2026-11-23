import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// On Windows, a working directory with a lowercase drive letter (d:\ rather than D:\)
// makes Vitest load two copies of its runner. Resolving the root from this file avoids it.
const root = fileURLToPath(new URL('.', import.meta.url));

// Unit tests cover plain TypeScript modules, so they run without the app's Vite plugins.
export default defineConfig({
  root,
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

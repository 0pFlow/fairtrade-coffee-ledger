import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Explicit, even though Vitest defaults to 'test': the Proof-of-Work
    // difficulty is read from NODE_ENV, so the whole suite depends on it.
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      // List every source file, including fully covered ones — the report is
      // evidence, so files at 100% still need to be visible in the table.
      reporter: [['text', { skipFull: false }], 'html'],
      include: ['src/**/*.ts'],
      // server.ts only binds a port; types.ts is erased at runtime and has no
      // executable statements, so it would report a misleading 0%.
      exclude: ['src/server.ts', 'src/types.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});

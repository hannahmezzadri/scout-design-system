import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Lit and tokens are peer deps — never bundle them.
  external: ['lit', 'lit/decorators.js', '@scout-ds/tokens'],
  target: 'es2022',
});

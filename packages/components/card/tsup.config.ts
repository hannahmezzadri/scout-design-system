import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['lit', 'lit/decorators.js', '@scout-ds/tokens', '@scout-ds/badge', '@scout-ds/show-more'],
  target: 'es2022',
});

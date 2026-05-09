import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['lit', 'lit/decorators.js', '@scout-ds/tokens', '@scout-ds/overlay', '@scout-ds/control'],
  target: 'es2022',
});

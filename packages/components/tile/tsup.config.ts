import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'lit',
    'lit/decorators.js',
    '@scout-ds/tokens',
    '@scout-ds/badge',
    '@scout-ds/button',
    '@scout-ds/show-more',
    '@scout-ds/skeleton',
  ],
  target: 'es2022',
});

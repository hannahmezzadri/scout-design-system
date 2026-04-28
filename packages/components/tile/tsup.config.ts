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
    '@scout/tokens',
    '@scout/badge',
    '@scout/button',
    '@scout/show-more',
    '@scout/skeleton',
  ],
  target: 'es2022',
});

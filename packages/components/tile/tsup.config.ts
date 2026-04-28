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
    '@connex/tokens',
    '@connex/badge',
    '@connex/button',
    '@connex/show-more',
    '@connex/skeleton',
  ],
  target: 'es2022',
});

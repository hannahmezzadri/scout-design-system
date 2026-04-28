import { defineConfig } from 'tsup';

export default defineConfig({
  // One entry per illustration so consumers can `import '@connex/illustrations/accordion'`
  // and tree-shake out the rest. `index` re-exports everything for convenience.
  entry: [
    'src/index.ts',
    'src/base.ts',
    'src/accordion.ts',
    'src/address.ts',
    'src/avatar.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['lit', 'lit/decorators.js', '@connex/tokens'],
  target: 'es2022',
});

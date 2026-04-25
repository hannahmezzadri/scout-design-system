import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// On GitHub Pages, the site lives under /<repo-name>/ unless a custom domain is set.
// Pass BASE_PATH at build time, e.g.:
//   BASE_PATH=/Connex-design-system/ pnpm --filter @connex/docs build
// Defaults to './' so relative paths work for both root domains and local preview.
const base = process.env.BASE_PATH ?? './';

export default defineConfig({
  base,
  // Source lives here (apps/docs). Build output goes to /docs at repo root for GitHub Pages.
  build: {
    outDir: resolve(__dirname, '../../docs'),
    emptyOutDir: true,
    sourcemap: true,
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
    strictPort: true,
  },
});

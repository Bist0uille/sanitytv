import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromeManifest from './manifest.chrome.config';
import firefoxManifest from './manifest.firefox.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = (process.env.BROWSER ?? 'chrome').toLowerCase();
if (browser !== 'chrome' && browser !== 'firefox') {
  throw new Error(`Unknown BROWSER='${browser}' (expected 'chrome' or 'firefox')`);
}

const manifest = browser === 'firefox' ? firefoxManifest : chromeManifest;

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: `dist-${browser}`,
    emptyOutDir: true,
  },
});

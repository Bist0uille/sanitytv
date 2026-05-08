import { defineManifest } from '@crxjs/vite-plugin';
import { base } from './manifest.base';

// Chrome (and Edge) manifest. The base is already Chrome-shaped, so
// this is a thin re-export. Kept as its own file for symmetry with
// `manifest.firefox.config.ts`.
export default defineManifest(base());

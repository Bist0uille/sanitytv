#!/usr/bin/env node
// Post-build patch for the Firefox bundle.
//
// @crxjs/vite-plugin only emits `background.service_worker` in the
// generated manifest because that is the canonical Chrome MV3 form.
// Firefox accepts the same form from 121+, but the AMO lint
// (`web-ext lint`) emits an error
// (BACKGROUND_SERVICE_WORKER_NOFALLBACK) unless `background.scripts`
// is also present. This script adds it after the Vite build so the
// linter is happy and the manifest works on both browsers.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '..', 'dist-firefox', 'manifest.json');

const raw = await fs.readFile(manifestPath, 'utf8');
const manifest = JSON.parse(raw);

if (!manifest.background?.service_worker) {
  console.error('post-build-firefox: expected background.service_worker — aborting.');
  process.exit(1);
}

manifest.background.scripts = [manifest.background.service_worker];

// Firefox for Android 142+ introduced data_collection_permissions
// support. We declare the same min version so the AMO lint stops
// warning about it. CRXJS's types don't know about gecko_android yet,
// so we add the field here, after the build.
manifest.browser_specific_settings ??= {};
manifest.browser_specific_settings.gecko_android = {
  strict_min_version: '142.0',
};

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  'post-build-firefox: added background.scripts and gecko_android to dist-firefox/manifest.json',
);

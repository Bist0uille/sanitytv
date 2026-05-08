#!/usr/bin/env node
// Generate the 4 store screenshots (1280x800) by driving Chromium with
// the unpacked extension and capturing real YouTube pages plus the
// extension's popup.

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const extensionPath = path.join(ROOT, 'dist');
const outDir = path.join(ROOT, 'store-assets', 'screenshots');
await fs.mkdir(outDir, { recursive: true });

const userDataDir = path.join(ROOT, 'diagnose-output', '.userdata-screenshots');
await fs.rm(userDataDir, { recursive: true, force: true });
await fs.mkdir(userDataDir, { recursive: true });

console.log('▶ Launching Chromium with the extension…');

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
});

await context.addCookies([
  { name: 'CONSENT', value: 'YES+1', domain: '.youtube.com', path: '/' },
  {
    name: 'SOCS',
    value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg',
    domain: '.youtube.com',
    path: '/',
  },
]);

const page = context.pages()[0] ?? (await context.newPage());

// --- Find the extension id from the loaded service worker so we can
// open chrome-extension://<id>/src/popup/index.html in a tab.
let extensionId = null;
for (const sw of context.serviceWorkers()) {
  const url = sw.url();
  const m = url.match(/^chrome-extension:\/\/([a-p]+)\//);
  if (m) extensionId = m[1];
}
if (!extensionId) {
  console.log('▶ No service worker yet, waiting for one to register…');
  const sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  const m = sw.url().match(/^chrome-extension:\/\/([a-p]+)\//);
  extensionId = m?.[1] ?? null;
}
if (!extensionId) {
  console.error('Could not determine extension id; aborting.');
  process.exit(1);
}
console.log(`▶ Extension id = ${extensionId}`);

async function shot(name, action) {
  console.log(`  → ${name}`);
  await action();
  const target = path.join(outDir, name);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`     saved ${path.relative(ROOT, target)}`);
}

// 1) Clickbait search WITH extension active — most flagged videos
//    are visibly greyed/hidden. The "money shot" of the listing.
//    Scroll past the Shorts shelf to land on the main video grid.
await shot('01-clickbait-filtered.png', async () => {
  await page.goto(
    'https://www.youtube.com/results?search_query=TOP+10+SHOCKING+DESTROYS',
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );
  await page.waitForTimeout(7000);
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(2500);
});

// 2) Further down — different mix of filtered cards.
await shot('02-clickbait-deeper.png', async () => {
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.waitForTimeout(2500);
});

// 3) The popup UI in its own page (chrome-extension://<id>/...).
await shot('03-popup-ui.png', async () => {
  await page.goto(
    `chrome-extension://${extensionId}/src/popup/index.html`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  // Centre the popup with a styled wrapper for a clean screenshot.
  await page.evaluate(() => {
    document.body.style.display = 'flex';
    document.body.style.alignItems = 'center';
    document.body.style.justifyContent = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.background =
      'radial-gradient(circle at top, #1a1d24 0%, #0f1115 100%)';
    document.body.style.width = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    const root = document.querySelector('main');
    if (root) {
      root.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)';
      root.style.borderRadius = '12px';
      root.style.transform = 'scale(1.4)';
    }
  });
  await page.waitForTimeout(800);
});

// 4) A Veritasium search showing zero false positives — this is the
//    "we won't break your favourite creators" reassurance shot.
await shot('04-creators-respected.png', async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(
    'https://www.youtube.com/results?search_query=veritasium',
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );
  await page.waitForTimeout(8000);
});

await context.close();
console.log('\n▶ Done. Screenshots in store-assets/screenshots/');

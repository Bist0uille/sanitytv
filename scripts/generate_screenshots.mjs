#!/usr/bin/env node
// Generate the store / README screenshots (1280x800).
//
// Three frames:
//   00-clickbait-before.png  — same YouTube clickbait search, with the
//                              extension installed but PAUSED (Active:off),
//                              page zoomed out so plenty of clickbait cards
//                              are visible. The "before" of the comparison.
//   01-clickbait-after.png   — same URL, extension re-enabled. Same zoom.
//                              The "after" of the comparison.
//   03-popup-ui.png          — popup at scale 1.4 with a centred dark
//                              background.

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

const CLICKBAIT_URL =
  'https://www.youtube.com/results?search_query=TOP+10+SHOCKING+DESTROYS';
// Aggressive zoom — at 0.6 we get ~4 cards per row and 3 visible rows
// in the 1280x800 frame, plus the full Shorts shelf at the top. The
// before/after delta then shows a wall of clickbait melting away.
const ZOOM = '0.6';

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

// Find the extension id from the registered service worker.
let extensionId = null;
for (const sw of context.serviceWorkers()) {
  const m = sw.url().match(/^chrome-extension:\/\/([a-p]+)\//);
  if (m) extensionId = m[1];
}
if (!extensionId) {
  const sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  extensionId = sw.url().match(/^chrome-extension:\/\/([a-p]+)\//)?.[1] ?? null;
}
if (!extensionId) {
  console.error('Could not determine extension id; aborting.');
  process.exit(1);
}
console.log(`▶ Extension id = ${extensionId}`);

const POPUP_URL = `chrome-extension://${extensionId}/src/popup/index.html`;

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 50,
  whitelist: [],
  blacklist: [],
  hideShortsCompletely: false,
  hideAllFlagged: true,
};

async function setSettings(partial) {
  await page.goto(POPUP_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    async (settings) => {
      await chrome.storage.sync.set({ 'sanitytv:settings': settings });
    },
    { ...DEFAULT_SETTINGS, ...partial },
  );
}

async function shot(name, action) {
  console.log(`  → ${name}`);
  await action();
  const target = path.join(outDir, name);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`     saved ${path.relative(ROOT, target)}`);
}

async function loadYouTubeAndZoom(url) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Initial settle — YouTube's first paint
  await page.waitForTimeout(8000);

  // Wait for the search-result grid to actually contain cards. With
  // hide-all-flagged + hide-all-shorts on, YouTube keeps lazy-loading
  // to fill the (mostly empty) viewport, so we have to coax it to
  // settle before the capture.
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll(
          'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer',
        ).length >= 10,
      { timeout: 20000 },
    )
    .catch(() => {
      // Best-effort — proceed even if YouTube never reaches 10 cards
      // (heavy filtering can leave very few).
    });

  // Scroll down to force lazy loading of more rows, then back to top
  // so the capture starts at the top of the SERP (where the Shorts
  // shelf lives in the before shot).
  await page.evaluate(() => window.scrollBy(0, 1600));
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);

  // Zoom out aggressively so the wall of clickbait (Shorts shelf +
  // multiple rows of thumbnails) is visible in a single frame. The
  // body.style.zoom CSS property is Chromium-specific and works
  // exactly like the user pressing Ctrl+- a few times.
  await page.evaluate((z) => {
    document.body.style.zoom = z;
  }, ZOOM);

  // Final settle for layout reflow after the zoom and any in-flight
  // content-script processing of newly-loaded cards.
  await page.waitForTimeout(3000);
}

// 0) Before — extension paused, clickbait shows in full glory.
await setSettings({ enabled: false });
await shot('00-clickbait-before.png', async () => {
  await loadYouTubeAndZoom(CLICKBAIT_URL);
});

// 1) After — extension on with both Hide-all-flagged AND
//    Hide-all-Shorts enabled. Same URL. This is the "max clean"
//    config a user gets after one extra click in the popup, and
//    it makes the before/after delta visible at a glance.
await setSettings({ enabled: true, hideAllFlagged: true, hideShortsCompletely: true });
await shot('01-clickbait-after.png', async () => {
  await loadYouTubeAndZoom(CLICKBAIT_URL);
});

// 3) The popup UI in its own page.
await shot('03-popup-ui.png', async () => {
  await page.goto(POPUP_URL, { waitUntil: 'domcontentloaded' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    document.body.style.zoom = '1';
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

// Clean stale legacy frames if they're still on disk from earlier runs.
for (const stale of [
  '01-clickbait-filtered.png',
  '02-clickbait-deeper.png',
  '04-creators-respected.png',
]) {
  await fs.rm(path.join(outDir, stale), { force: true });
}

await context.close();
console.log('\n▶ Done. Screenshots in store-assets/screenshots/');

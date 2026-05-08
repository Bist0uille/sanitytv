import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'dist');
const screenshotsDir = path.resolve(__dirname, '..', 'diagnose-output');
await fs.mkdir(screenshotsDir, { recursive: true });

const url =
  process.argv[2] ??
  'https://www.youtube.com/results?search_query=TOP+10+SHOCKING+DESTROYS';

console.log(`▶ Launching Chromium with extension at: ${extensionPath}`);
console.log(`▶ Target URL: ${url}`);

const userDataDir = path.join(screenshotsDir, '.userdata');
await fs.rm(userDataDir, { recursive: true, force: true });
await fs.mkdir(userDataDir, { recursive: true });

const sanitytvLogs = [];
const otherErrors = [];

const attachListeners = (page) => {
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('SanityTV')) {
      sanitytvLogs.push(`[${msg.type()}] ${text}`);
    } else if (msg.type() === 'error') {
      otherErrors.push(text.slice(0, 200));
    }
  });
  page.on('pageerror', (err) => {
    otherErrors.push(`PAGEERROR: ${err.message}`);
  });
  page.on('crash', () => console.log('▶ Page crashed'));
};

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1366, height: 900 },
  locale: 'en-US', // forces simpler consent UI
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
});
console.log('▶ Browser launched');

// Bypass YouTube consent dialog by pre-seeding the consent cookies. These
// cookie values are stable and well-documented across the EU YouTube property.
await context.addCookies([
  { name: 'CONSENT', value: 'YES+1', domain: '.youtube.com', path: '/' },
  {
    name: 'SOCS',
    value: 'CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg',
    domain: '.youtube.com',
    path: '/',
  },
]);

context.on('page', attachListeners);

// Reuse the about:blank page that opens by default and attach our listeners.
const existingPages = context.pages();
const page = existingPages[0] ?? (await context.newPage());
attachListeners(page);

console.log('▶ Navigating…');
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('▶ Navigated to', page.url());

// Dismiss cookie consent — try several known button labels.
async function dismissConsent() {
  const candidates = [
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Tout accepter")',
    'button:has-text("Reject all")',
    'button:has-text("Tout refuser")',
    'button[aria-label*="Accept" i]',
    'button[aria-label*="accept" i]',
  ];
  for (const sel of candidates) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click({ timeout: 2000 });
        console.log(`▶ Consent dismissed via "${sel}"`);
        return true;
      }
    } catch {
      /* try next */
    }
  }
  console.log('▶ No consent banner detected (or none of the buttons matched)');
  return false;
}

await dismissConsent();
await page.waitForTimeout(2000);

console.log('▶ Waiting for content script and YouTube to fully render…');
await page.waitForTimeout(8000);

// Force a small scroll so YouTube hydrates more rows.
await page.evaluate(() => window.scrollBy(0, 600));
await page.waitForTimeout(3000);

const diagLogs = await page.evaluate(() => {
  try {
    return JSON.parse(sessionStorage.getItem('sanitytv:diag') || '[]');
  } catch {
    return [];
  }
});

const probe = await page.evaluate(() => {
  const videos = document.querySelectorAll(
    'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer',
  );
  const tagged = document.querySelectorAll('[data-sanitytv]');
  const hidden = document.querySelectorAll('[data-sanitytv="hide"]');
  const grey = document.querySelectorAll('[data-sanitytv="grey"]');
  const styleTag = document.getElementById('sanitytv-styles');
  const sample = Array.from(videos)
    .slice(0, 12)
    .map((el) => {
      const titleEl = el.querySelector('#video-title, a#video-title-link, h3 a');
      const channelEl = el.querySelector(
        'ytd-channel-name a, #channel-name a, .ytd-video-meta-block #channel-name a',
      );
      return {
        tag: el.tagName.toLowerCase(),
        title: (titleEl?.textContent || titleEl?.getAttribute?.('title') || '')
          .trim()
          .slice(0, 80),
        channel: (channelEl?.textContent || '').trim(),
        sanitytv: el.getAttribute('data-sanitytv'),
        reason: el.getAttribute('data-sanitytv-reason'),
      };
    });
  return {
    videoCount: videos.length,
    taggedCount: tagged.length,
    hiddenCount: hidden.length,
    greyCount: grey.length,
    hasStyleTag: !!styleTag,
    url: location.href,
    sample,
  };
});

const screenshotPath = path.join(screenshotsDir, 'page.png');
await page.screenshot({ path: screenshotPath, fullPage: false });
console.log(`▶ Screenshot saved to ${screenshotPath}`);

console.log('\n=== SanityTV diagnostic logs (from sessionStorage) ===');
console.log(diagLogs.length === 0 ? '(none captured)' : diagLogs.join('\n'));

console.log('\n=== SanityTV console logs (Playwright capture, may be empty) ===');
console.log(sanitytvLogs.length === 0 ? '(none captured)' : sanitytvLogs.join('\n'));

console.log('\n=== Other page errors ===');
if (otherErrors.length === 0) {
  console.log('(none)');
} else {
  for (const line of otherErrors.slice(0, 12)) console.log(line);
  if (otherErrors.length > 12) console.log(`(+${otherErrors.length - 12} more truncated)`);
}

console.log('\n=== Page probe ===');
console.log(JSON.stringify(probe, null, 2));

await fs.writeFile(
  path.join(screenshotsDir, 'logs.txt'),
  [
    '=== SanityTV logs ===',
    sanitytvLogs.join('\n') || '(none)',
    '',
    '=== Other errors ===',
    otherErrors.join('\n') || '(none)',
    '',
    '=== Probe ===',
    JSON.stringify(probe, null, 2),
  ].join('\n'),
);

await context.close();
console.log('\n▶ Done.');

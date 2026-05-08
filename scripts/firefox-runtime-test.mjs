#!/usr/bin/env node
// Functional runtime test on Firefox using Selenium + geckodriver.
//
// Selenium installs the unsigned XPI as a TEMPORARY add-on through
// Marionette (the same mechanism `web-ext run` uses), drives Firefox
// to YouTube, and probes the DOM for `data-sanitytv` attributes.
//
// Goal: prove the content script actually runs in Firefox, not just
// that the manifest is valid.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { Builder, By } from 'selenium-webdriver';
import firefoxOpts from 'selenium-webdriver/firefox.js';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const XPI = path.join(ROOT, 'sanitytv-firefox-v0.0.3.zip');
const URL =
  'https://www.youtube.com/results?search_query=TOP+10+SHOCKING+DESTROYS';

await fs.access(XPI); // throws if missing

console.log('▶ Starting geckodriver…');
const geckoBin = path.join(ROOT, 'node_modules', '.bin', 'geckodriver');
const geckoProc = spawn(geckoBin, ['--port=4444'], { stdio: ['ignore', 'pipe', 'pipe'] });
geckoProc.on('error', (err) => console.error('geckodriver spawn error:', err));
// Wait until geckodriver prints its "Listening on" line.
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('geckodriver did not start in 15s')), 15000);
  geckoProc.stdout.on('data', (chunk) => {
    if (chunk.toString().includes('Listening on')) {
      clearTimeout(t);
      resolve();
    }
  });
  geckoProc.stderr.on('data', (chunk) => {
    if (chunk.toString().includes('Listening on')) {
      clearTimeout(t);
      resolve();
    }
  });
});
console.log('▶ geckodriver up');

const options = new firefoxOpts.Options();
// Headed run so we can see it (and so YouTube's renderers behave normally).
// Comment out the line below for headless if you need to.
// options.addArguments('-headless');

console.log('▶ Launching Firefox via Selenium…');
const driver = await new Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(options)
  .usingServer('http://localhost:4444')
  .build();

try {
  // Marionette's installAddon installs an unsigned XPI temporarily —
  // exactly the same path as web-ext run.
  console.log(`▶ Installing temporary add-on from ${path.basename(XPI)}…`);
  const session = await driver.getSession();
  console.log(`  session id: ${session.getId()}`);
  // selenium-webdriver firefox.Driver has installAddon:
  await driver.installAddon(XPI, /* temporary= */ true);
  console.log('▶ Add-on installed temporarily');

  console.log('▶ Navigating to YouTube…');
  await driver.get(URL);
  // Let YouTube hydrate.
  await driver.sleep(8000);
  await driver.executeScript('window.scrollBy(0, 800);');
  await driver.sleep(3000);

  const probe = await driver.executeScript(`
    const all = document.querySelectorAll(
      'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer'
    );
    const tagged = document.querySelectorAll('[data-sanitytv]');
    const hidden = document.querySelectorAll('[data-sanitytv="hide"]');
    const grey = document.querySelectorAll('[data-sanitytv="grey"]');
    const noShortsClass = document.body.classList.contains('sanitytv-no-shorts');
    const sample = Array.from(all).slice(0, 6).map((el) => {
      const titleEl = el.querySelector('#video-title, a#video-title-link, h3 a');
      return {
        title: (titleEl?.textContent ?? '').trim().slice(0, 80),
        sanitytv: el.getAttribute('data-sanitytv'),
        reason: el.getAttribute('data-sanitytv-reason'),
      };
    });
    return { total: all.length, tagged: tagged.length, hidden: hidden.length,
             grey: grey.length, noShortsClass, sample };
  `);

  // Save a screenshot for the record.
  const png = await driver.takeScreenshot();
  const shotPath = path.join(ROOT, 'diagnose-output', 'firefox-runtime.png');
  await fs.mkdir(path.dirname(shotPath), { recursive: true });
  await fs.writeFile(shotPath, png, 'base64');
  console.log(`▶ Screenshot at ${path.relative(ROOT, shotPath)}`);

  console.log('\n=== Firefox runtime probe ===');
  console.log(JSON.stringify(probe, null, 2));

  let verdict;
  if (probe.total === 0) {
    verdict = 'INCONCLUSIVE — page rendered no video cards';
  } else if (probe.tagged === 0) {
    verdict = `FAIL — ${probe.total} cards present but extension tagged 0`;
  } else {
    verdict =
      `PASS — ${probe.tagged}/${probe.total} cards tagged ` +
      `(${probe.hidden} hide, ${probe.grey} grey, noShortsClass=${probe.noShortsClass})`;
  }
  console.log('\nVerdict:', verdict);
  process.exitCode = verdict.startsWith('FAIL') ? 1 : 0;
} finally {
  await driver.quit();
  geckoProc.kill();
}

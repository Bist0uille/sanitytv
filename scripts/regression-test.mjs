#!/usr/bin/env node
// Empirical regression harness: launches Chromium with the unpacked
// extension, walks through a fixed corpus of YouTube searches, and
// produces diagnose-output/regression-report.md.
//
// Goal: detect regressions on the messy reality of YouTube search
// (false positives on serious creators, false negatives on real
// clickbait) that the synthetic corpus in tests/regression-corpus.test.ts
// can't catch.

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const extensionPath = path.join(ROOT, 'dist');
const outputDir = path.join(ROOT, 'diagnose-output');
await fs.mkdir(outputDir, { recursive: true });

/**
 * Each query asserts a macro-level expectation on the result mix.
 * The harness reports PASS / FAIL per query against this expectation
 * AND lists per-video decisions for human review of edge cases.
 */
const QUERIES = [
  // ── Should be heavily flagged ──────────────────────────────
  {
    id: 'clickbait-en-strong',
    url: 'https://www.youtube.com/results?search_query=TOP+10+SHOCKING+DESTROYS',
    expect: { flaggedPctMin: 70 },
    rationale: 'multi-signal clickbait, expect at least 70% masked',
  },
  {
    id: 'clickbait-fr-strong',
    url: 'https://www.youtube.com/results?search_query=vous+n%27allez+pas+croire',
    expect: { flaggedPctMin: 50 },
    rationale: 'FR clickbait phrase queries; 50% is realistic floor',
  },
  {
    id: 'tabloid-fr',
    url: 'https://www.youtube.com/results?search_query=closer+magazine+people+scandale',
    expect: { flaggedPctMin: 30 },
  },
  {
    id: 'conspiracy-fr',
    url: 'https://www.youtube.com/results?search_query=nouvel+ordre+mondial',
    expect: { flaggedPctMin: 30 },
  },
  {
    id: 'morbide-fr',
    url: 'https://www.youtube.com/results?search_query=fait+divers+meurtre',
    expect: { flaggedPctMin: 30 },
    rationale: 'gore keywords should fire on at least a third',
  },
  {
    id: 'reaction-drama',
    url: 'https://www.youtube.com/results?search_query=youtuber+drama+exposed',
    expect: { flaggedPctMin: 40 },
  },
  {
    id: 'kid-elsagate',
    url: 'https://www.youtube.com/results?search_query=elsa+spiderman+pregnant',
    expect: { flaggedPctMin: 40 },
    rationale: 'tests harmful_kid_content rule on real Elsagate-adjacent results',
  },
  {
    id: 'kid-challenge',
    url: 'https://www.youtube.com/results?search_query=tide+pod+challenge',
    expect: { flaggedPctMin: 40 },
    rationale: 'tests the dangerous-challenge regex',
  },

  // ── Should mostly NOT be flagged ──────────────────────────
  {
    id: 'serious-veritasium',
    url: 'https://www.youtube.com/results?search_query=veritasium',
    expect: { flaggedPctMax: 15 },
    rationale: 'serious educator must not be touched',
  },
  {
    id: 'serious-kurzgesagt',
    url: 'https://www.youtube.com/results?search_query=kurzgesagt',
    expect: { flaggedPctMax: 15 },
  },
  {
    id: 'news-fr-le-monde',
    url: 'https://www.youtube.com/results?search_query=le+monde+podcast',
    expect: { flaggedPctMax: 20 },
  },
  {
    id: 'history-academic',
    url: 'https://www.youtube.com/results?search_query=yale+ww2+lecture',
    expect: { flaggedPctMax: 20 },
    rationale: 'academic context with potentially morbid words must not over-flag',
  },
  {
    id: 'sport-boxing',
    url: 'https://www.youtube.com/results?search_query=boxing+knockout+highlights',
    expect: { flaggedPctMax: 25 },
    rationale: 'combat verbs in sport context — should mostly pass',
  },
  {
    id: 'tech-mkbhd',
    url: 'https://www.youtube.com/results?search_query=mkbhd+iphone+review',
    expect: { flaggedPctMax: 15 },
  },
  {
    id: 'music-lofi',
    url: 'https://www.youtube.com/results?search_query=lofi+beats+study',
    expect: { flaggedPctMax: 10 },
  },
  {
    id: 'tutorial-tech',
    url: 'https://www.youtube.com/results?search_query=react+tutorial+2026',
    expect: { flaggedPctMax: 10 },
  },
  {
    id: 'kid-innocent',
    url: 'https://www.youtube.com/results?search_query=peppa+pig+english',
    expect: { flaggedPctMax: 15 },
    rationale: 'legit kid content — must not be wrecked by harmful_kid_content',
  },
  {
    id: 'trick-vs',
    url: 'https://www.youtube.com/results?search_query=linux+vs+windows+benchmark',
    expect: { flaggedPctMax: 20 },
    rationale: 'vs pattern is a soft signal — must not push past grey on its own',
  },
];

const userDataDir = path.join(outputDir, '.userdata-regression');
await fs.rm(userDataDir, { recursive: true, force: true });
await fs.mkdir(userDataDir, { recursive: true });

console.log(`▶ Running ${QUERIES.length} queries…`);
console.log(`▶ Extension: ${extensionPath}`);

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1366, height: 900 },
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

async function probeQuery(query) {
  await page.goto(query.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  try {
    await page.evaluate(() => window.scrollBy(0, 800));
  } catch {
    /* ignore — scrolling failures are non-fatal */
  }
  await page.waitForTimeout(3000);

  // Rely on DOM data-attributes only (scoped per page, reset on navigation).
  // Avoids sessionStorage/SecurityError issues on cross-origin redirects.
  const data = await page.evaluate(() => {
    const videos = document.querySelectorAll(
      'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer',
    );
    const sample = Array.from(videos).map((el) => {
      const titleEl = el.querySelector('#video-title, a#video-title-link, h3 a');
      return {
        title: (titleEl?.textContent || titleEl?.getAttribute?.('title') || '')
          .trim()
          .slice(0, 90),
        sanitytv: el.getAttribute('data-sanitytv'),
        reason: el.getAttribute('data-sanitytv-reason'),
      };
    });
    return { sample };
  });

  const total = data.sample.length;
  const hide = data.sample.filter((s) => s.sanitytv === 'hide').length;
  const grey = data.sample.filter((s) => s.sanitytv === 'grey').length;
  const normal = total - hide - grey;
  const flaggedPct = total === 0 ? 0 : Math.round(((hide + grey) / total) * 100);

  let pass = true;
  const reasons = [];
  if (query.expect.flaggedPctMin !== undefined && flaggedPct < query.expect.flaggedPctMin) {
    pass = false;
    reasons.push(`flagged=${flaggedPct}% < expected ≥${query.expect.flaggedPctMin}%`);
  }
  if (query.expect.flaggedPctMax !== undefined && flaggedPct > query.expect.flaggedPctMax) {
    pass = false;
    reasons.push(`flagged=${flaggedPct}% > expected ≤${query.expect.flaggedPctMax}%`);
  }

  return {
    total,
    hide,
    grey,
    normal,
    flaggedPct,
    pass,
    failReasons: reasons,
    sample: data.sample,
  };
}

const results = [];
for (const query of QUERIES) {
  process.stdout.write(`  ${query.id.padEnd(28)} `);
  try {
    const r = await probeQuery(query);
    results.push({ query, ...r });
    console.log(`${r.pass ? 'PASS' : 'FAIL'} (${r.hide} hide, ${r.grey} grey, ${r.normal} normal — ${r.flaggedPct}% flagged)`);
    if (!r.pass) {
      for (const reason of r.failReasons) console.log(`    ↳ ${reason}`);
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    results.push({ query, error: String(err) });
  }
}

await context.close();

// ── Render markdown report ───────────────────────────────────
const lines = [];
lines.push(`# SanityTV regression report`);
lines.push('');
lines.push(`Generated ${new Date().toISOString()}`);
lines.push('');

const passed = results.filter((r) => r.pass).length;
const total = results.length;
lines.push(`**${passed}/${total} queries pass.**`);
lines.push('');

lines.push(`## Summary`);
lines.push('');
lines.push(`| Query | Total | Hide | Grey | Normal | Flagged % | Result |`);
lines.push(`|---|---|---|---|---|---|---|`);
for (const r of results) {
  if (r.error) {
    lines.push(`| ${r.query.id} | — | — | — | — | — | ⚠ ${r.error.slice(0, 60)} |`);
  } else {
    const verdict = r.pass ? '✅ pass' : '❌ fail';
    lines.push(`| ${r.query.id} | ${r.total} | ${r.hide} | ${r.grey} | ${r.normal} | ${r.flaggedPct}% | ${verdict} |`);
  }
}
lines.push('');

for (const r of results) {
  lines.push(`## ${r.query.id}`);
  lines.push('');
  lines.push(`URL: <${r.query.url}>`);
  if (r.query.rationale) lines.push(`Expected: ${r.query.rationale}`);
  if (r.query.expect.flaggedPctMin !== undefined) {
    lines.push(`Threshold: flagged ≥ ${r.query.expect.flaggedPctMin}%`);
  }
  if (r.query.expect.flaggedPctMax !== undefined) {
    lines.push(`Threshold: flagged ≤ ${r.query.expect.flaggedPctMax}%`);
  }
  if (r.error) {
    lines.push(``);
    lines.push(`**ERROR:** ${r.error}`);
    lines.push('');
    continue;
  }
  lines.push('');
  lines.push(`Result: **${r.pass ? 'PASS' : 'FAIL'}** — ${r.hide} hide, ${r.grey} grey, ${r.normal} normal (${r.flaggedPct}% flagged of ${r.total}).`);
  if (!r.pass) {
    for (const reason of r.failReasons) lines.push(`- ⚠ ${reason}`);
  }
  lines.push('');

  const hidden = r.sample.filter((s) => s.sanitytv === 'hide').slice(0, 5);
  const greyed = r.sample.filter((s) => s.sanitytv === 'grey').slice(0, 5);
  const kept = r.sample.filter((s) => !s.sanitytv).slice(0, 5);

  if (hidden.length) {
    lines.push(`### Hidden (top ${hidden.length})`);
    for (const s of hidden) lines.push(`- ${s.title} _(${s.reason ?? '—'})_`);
    lines.push('');
  }
  if (greyed.length) {
    lines.push(`### Greyed (top ${greyed.length})`);
    for (const s of greyed) lines.push(`- ${s.title} _(${s.reason ?? '—'})_`);
    lines.push('');
  }
  if (kept.length) {
    lines.push(`### Kept (top ${kept.length})`);
    for (const s of kept) lines.push(`- ${s.title}`);
    lines.push('');
  }
}

const reportPath = path.join(outputDir, 'regression-report.md');
await fs.writeFile(reportPath, lines.join('\n'));
console.log(`\n▶ Report written to ${reportPath}`);
console.log(`▶ Result: ${passed}/${total} queries pass.`);

if (passed < total) {
  process.exitCode = 1;
}

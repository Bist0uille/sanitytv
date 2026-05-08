# Build instructions for AMO reviewers

This document explains how to reproduce the exact `dist-firefox/`
output that was submitted to addons.mozilla.org.

## Environment

- **Node**: ≥ 20 (LTS recommended)
- **npm**: ≥ 10
- **OS**: any (linux/macOS/Windows). Tested on Ubuntu 24.04 and
  macOS 14.

## Reproduce the build

From the source ZIP root, or from the cloned repository:

```bash
npm install
BROWSER=firefox npm run build
```

The output lands at `dist-firefox/`. Compare the produced
`dist-firefox/manifest.json` to the manifest inside the submitted
XPI — they must be identical.

## What runs at build time

- `tsc -b` — type-check only, emits no output.
- `vite build` — invoked with `BROWSER=firefox`, picks
  `manifest.firefox.config.ts`, writes the bundle to `dist-firefox/`.
- `@crxjs/vite-plugin` — wraps the Vite build to produce a
  Manifest-V3-compatible directory tree (content-script loader,
  service-worker loader, web-accessible-resources entries).

No network access is performed during the build, beyond `npm install`
fetching the dependencies declared in `package.json` (all from the
public npm registry, no private registries).

## Source layout (relevant for review)

```
src/
├── background/index.ts           ← MV3 service worker (1 listener)
├── content/                      ← Content script injected on YouTube
│   ├── index.ts                  ← entry point, wires observer + rules + injector
│   ├── observer.ts               ← MutationObserver over video renderers
│   ├── extractor.ts              ← reads title/channel/duration from DOM
│   └── injector.ts               ← applies CSS class for masking
├── detection/
│   ├── rules/                    ← 5 detector files (clickbait_title,
│   │                                rage_bait, brainrot_structural,
│   │                                sensationalism, harmful_kid_content)
│   └── scorer.ts                 ← signal aggregation, capped at 100
├── popup/                        ← React 18 popup app
└── storage/index.ts              ← chrome.storage.sync/local wrapper

manifest.base.ts                  ← shared manifest fields
manifest.chrome.config.ts         ← Chrome variant
manifest.firefox.config.ts        ← Firefox variant (this one)
vite.config.ts                    ← reads BROWSER env to pick the manifest
```

## Tests and quality checks

The repo runs 130 unit tests on every commit:

```bash
npm test
```

Empirical regression test (drives Firefox or Chromium with Playwright
through 18 real YouTube queries):

```bash
node scripts/regression-test.mjs
```

End-of-run target: `16/18 queries pass`. The two accepted gaps are
documented in `docs/adr/0006-regression-test-strategy.md`.

## Security audit

A self-published audit lives at `docs/SECURITY-AUDIT.md`. Verdict:
**GO**. Verifies at the bundle level that we make zero network calls
(no `fetch`, no `XMLHttpRequest`, no `WebSocket`, no
`EventSource`, no `sendBeacon`).

## Privacy declarations alignment

- The privacy policy at
  <https://bist0uille.github.io/sanitytv/PRIVACY.html> claims **no data
  collection, no transmission, no third-party sharing**.
- The manifest declares
  `browser_specific_settings.gecko.data_collection_permissions.required = ["none"]`.
- The audit's finding `S-02` confirms zero network primitives in the
  production bundle.

These three should all match. If any reviewer finds a discrepancy,
please flag it — that would be a real bug from our side.

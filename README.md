# SanityTV

> A clean YouTube. Local. Private. Free.

<p align="center">
  <img src="./store-assets/logo.png" alt="SanityTV" width="280">
</p>

SanityTV is a browser extension (Chrome and Firefox) that automatically
removes YouTube videos engineered to hijack your attention — clickbait,
rage-bait, sensationalism, brainrot Shorts, and content harmful to
children. Your feed stays full of what's actually worth watching.

Everything happens inside your browser. Nothing leaves your device.
No account, no API key, no tracking, no monetisation.

---

## See the difference

Same search query, same browser. Left: SanityTV paused. Right:
SanityTV active with the default settings.

**Before** — Shorts shelf, screaming thumbnails, listicles, "shocking"
everywhere:

<p align="center">
  <img src="./store-assets/screenshots/00-clickbait-before.png" alt="YouTube clickbait results without SanityTV" width="800">
</p>

**After** — the noise is gone. The Shorts shelf is silent, the most
aggressive cards are out of the feed, and what remains is browsable
without flinching:

<p align="center">
  <img src="./store-assets/screenshots/01-clickbait-after.png" alt="Same results with SanityTV active" width="800">
</p>

---

## What gets filtered

| Category                | Examples we hide                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Clickbait titles**    | _TOP 10 SHOCKING …_, _You won't believe …_, _Vous n'allez pas croire …_, all-caps shouting, emoji spam, ponctuation excessive                                |
| **Rage-bait**           | _Ben Shapiro DESTROYS …_, _Le ministre HUMILIÉ_, culture-war framings, vs/contre confrontations                                                              |
| **Sensationalism**      | _The truth they don't want you to know_, _illuminati_, _nouvel ordre mondial_, hyperbolic superlatives, morbid tabloid keywords (viol, meurtre, massacre, …) |
| **Brainrot Shorts**     | A Short alone is a soft signal — combined with any other clickbait pattern it disappears                                                                     |
| **Harmful kid content** | _Frozen Elsa pregnant by Spider-Man_-style Elsagate, named dangerous challenges (Tide Pod, Blackout, Skull Breaker, …)                                       |

It works in **English and French** out of the box.

---

## What stays

| Kept (untouched)                                                                        |
| --------------------------------------------------------------------------------------- |
| Serious educators (Veritasium, Kurzgesagt, Fouloscopie, …)                              |
| Real journalism (Le Monde, ARTE, PBS, BBC)                                              |
| Tutorials, tech reviews, music, vlogs, lifestyle                                        |
| Academic lectures, even when they cover hard topics (war, atrocities) — context matters |
| Sport play-by-play and gaming, where combat language is literal                         |

---

## The popup

Click the SanityTV icon in your toolbar to open the controls:

<p align="center">
  <img src="./store-assets/screenshots/03-popup-ui.png" alt="Popup UI" width="500">
</p>

- **Active / Paused** — one click to disable filtering on demand.
- **Sensitivity** — slider from gentle to aggressive. The default 50
  is the recommended balance.
- **Activity** — counters of how many videos were hidden (resettable).
- **Filtering style** — _on by default_: flagged videos disappear
  outright. Turn it off to get a softer experience: borderline
  videos are dimmed with a `⚠` badge and stay clickable.
- **Hide all Shorts** — _on by default_. Removes every short-form video
  and the Shorts shelf from search results. Turn off to get them back.
- **Channel lists** — always show some channels (whitelist) or always
  hide others (blacklist), regardless of the score.

---

## Privacy & security

SanityTV does not collect, transmit, or sell any data. The full
[privacy policy](./docs/PRIVACY.md) explains exactly what the
extension reads (visible video titles, channel names and durations on
YouTube pages, never written to disk and never sent anywhere).

A [security audit](./docs/SECURITY-AUDIT.md) of the v0.0.3 codebase is
checked into the repo: zero remote code, zero network calls, zero
runtime-dependency vulnerabilities, narrow permission scope.

The extension only requests two permissions:

- `storage` — to keep your settings on your device.
- `*://*.youtube.com/*` — to inject the filter into YouTube pages
  (and only YouTube pages).

No other website is touched. No analytics, no third-party SDK, no
network call. Firefox builds additionally declare
`browser_specific_settings.gecko.data_collection_permissions = ["none"]`,
which surfaces the same guarantee in the install dialog.

---

## Install

**From the Chrome Web Store** — coming soon. Submission package ready
in [`store-assets/`](./store-assets/) (see `FILL-IN.md`).

**From Mozilla Add-ons (Firefox)** — coming soon. Submission package
ready in [`store-assets/`](./store-assets/) (see `AMO-FILL-IN.md`).

**Manual install (developer mode)** while reviews are pending:

### Chrome

```bash
git clone https://github.com/Bist0uille/sanitytv.git
cd sanitytv
npm install
npm run build:chrome
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** →
**Load unpacked** → select the `dist-chrome/` folder.

### Firefox

```bash
git clone https://github.com/Bist0uille/sanitytv.git
cd sanitytv
npm install
npm run build:firefox
```

Then in Firefox: `about:debugging#/runtime/this-firefox` → **Load
Temporary Add-on** → select `dist-firefox/manifest.json`.
(The temporary load lasts until Firefox restarts. AMO publication
removes the need for this.)

---

## Roadmap

- [x] **Phase 1** — Detection engine + popup UI
- [x] **Phase 2** — Quality bar (synthetic + empirical regression
      suites, 7 ADRs, security audit)
- [x] **Phase 3** — Chrome Web Store + Mozilla AMO submission
      packages, multi-target build (Chrome / Firefox)
- [ ] **Phase 4** — Publish on the Chrome Web Store and AMO
- [ ] **Phase 5** — Safari (macOS App Store via the Safari Web
      Extension wrapper)

---

## For developers

Curious how it works, want to contribute, or want to verify there is
no funny business in the source? Welcome.

### Tech stack

- TypeScript 5 strict
- Vite + [`@crxjs/vite-plugin`](https://crxjs.dev/) for Manifest V3
- React 18 (popup)
- Vitest + Testing Library (unit, 130 tests)
- Playwright (Chrome empirical regression harness)
- Selenium WebDriver + geckodriver (Firefox functional runtime test)
- web-ext (AMO lint and Firefox dev launch)
- ESLint 9 (flat config) + Prettier
- Husky + lint-staged
- GitHub Actions (CI: lint, format, typecheck, test, build)

Requires Node ≥ 20 and npm.

```bash
npm install

# build
npm run build:chrome              # → dist-chrome/
npm run build:firefox             # → dist-firefox/
npm run package:chrome            # → sanitytv-v$VERSION.zip
npm run package:firefox           # → sanitytv-firefox-v$VERSION.zip

# quality
npm test                          # 130 unit tests
npm run typecheck
npm run lint
npm run format

# dev mode (Chrome HMR)
npm run dev
```

### Project layout

```
src/
├── background/   # MV3 service worker
├── content/      # Content scripts injected on YouTube pages
│   ├── observer.ts
│   ├── extractor.ts
│   └── injector.ts
├── detection/
│   ├── rules/    # 5 detector files
│   └── scorer.ts # Signal aggregation (sum, capped at 100)
├── popup/        # React popup app
├── storage/      # chrome.storage abstraction (settings + stats)
└── types/

manifest.base.ts                  # shared manifest fields
manifest.chrome.config.ts         # Chrome (and Edge) variant
manifest.firefox.config.ts        # Firefox variant + gecko block
vite.config.ts                    # reads BROWSER env var

tests/                            # 130 unit tests across 11 files
scripts/                          # diagnose, regression, runtime tests,
                                  # icon/promo/screenshot generators
docs/
├── PRIVACY.md
├── SECURITY-AUDIT.md
├── AMO-BUILD.md                  # build instructions for Mozilla reviewers
└── adr/                          # 7 architecture decision records

store-assets/                     # listing copy + screenshots + promo
                                  # ├── FILL-IN.md       (Chrome Web Store)
                                  # └── AMO-FILL-IN.md   (Mozilla AMO)
```

### Quality bar

Three harnesses must be green before any rule change ships:

- **Synthetic** — `tests/regression-corpus.test.ts`, ~60 curated titles
  with an `expected` display band. Runs in CI. **60/60 currently pass.**
- **Empirical (Chrome)** — `node scripts/regression-test.mjs` walks
  ~18 real YouTube searches via Playwright and asserts macro
  thresholds per query. **16/18 currently pass.** The two accepted
  limitations are documented in
  [ADR-0006](./docs/adr/0006-regression-test-strategy.md).
- **Functional (Firefox)** —
  `node scripts/firefox-runtime-test.mjs` installs the unsigned XPI
  via geckodriver+Marionette into a real Firefox, navigates to the
  clickbait query, and probes `data-sanitytv` attributes.
  **24/24 cards tagged.**

The Firefox bundle additionally passes `web-ext lint` (Mozilla's
official validator: 0 errors, 3 acceptable warnings — see
`docs/SECURITY-AUDIT.md` and the post-build patcher in
`scripts/post-build-firefox.mjs` for context).

### Architecture decisions

Major design decisions are documented as ADRs under
[`docs/adr/`](./docs/adr/):

- [ADR-0001](./docs/adr/0001-no-byok-no-embedded-keys.md) — No BYOK, no embedded API keys
- [ADR-0002](./docs/adr/0002-sum-aggregation-not-mean.md) — Aggregate signals by sum, not weighted mean
- [ADR-0003](./docs/adr/0003-three-level-display-not-binary.md) — Three-level display strategy (with hide-all default)
- [ADR-0004](./docs/adr/0004-dom-dedup-via-data-attribute.md) — DOM dedup via attribute marker
- [ADR-0005](./docs/adr/0005-shorts-format-not-inherently-brainrot.md) — Shorts format ≠ brainrot
- [ADR-0006](./docs/adr/0006-regression-test-strategy.md) — Regression test strategy (synthetic + empirical)
- [ADR-0007](./docs/adr/0007-not-a-parental-control.md) — Not a parental control

### Not a parental control

SanityTV's `harmful_kid_content` rule does mask Elsagate-style content
and named dangerous challenges, but **this is not a substitute for a
parental control**. A determined adversary defeats heuristic filters
trivially. For real protection of a child's YouTube experience, use
[YouTube Kids](https://www.youtubekids.com/) or a dedicated parental
control product. See [ADR-0007](./docs/adr/0007-not-a-parental-control.md).

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The repo enforces
Conventional Commits, lint, typecheck, and test on every commit.

---

## License

[MIT](./LICENSE) — use it, fork it, audit it.

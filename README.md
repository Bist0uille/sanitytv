# SanityTV

> A Chrome extension that filters out YouTube videos exploiting
> attention-engineering patterns: clickbait, rage-bait, brainrot
> Shorts, sensationalism, and harmful kid content.

**Current version:** 0.0.2 (Phase 1 V0, store-ready)

## Status

- 5 detection rules (clickbait_title, rage_bait, brainrot_structural,
  sensationalism, harmful_kid_content) covering EN + FR
- 124 unit tests passing
- 60/60 synthetic regression corpus passing
- 16/18 empirical regression queries passing (two accepted limitations
  documented in [ADR-0006](./docs/adr/0006-regression-test-strategy.md))
- Chrome Web Store submission package ready in
  [`store-assets/`](./store-assets/) — see its README for the
  step-by-step submission

## Why

The YouTube ecosystem optimises for watch time, not for what's good for
you. Existing extensions like [Unhook](https://unhook.app/) hide UI
elements (Shorts, sidebar, recommendations) but don't classify the
content itself. SanityTV combines UI cleaning with **automatic
multi-signal classification** of the content.

## Approach

SanityTV scores each video on the YouTube home, search, and sidebar
using a transparent set of heuristics, then takes one of two actions
depending on the user's preferred mode:

- **Default — hide all flagged.** A video that scores past the
  threshold simply disappears from the feed. You see fewer videos,
  no badges, no clutter.
- **Soft mode — opt-in via the popup.** Borderline videos (score
  30–60) are dimmed with a `⚠ sensational content` badge and stay
  clickable; only the very high-confidence ones (score ≥ 60) are
  hidden.

The scoring engine is identical in both modes — the only difference is
how borderline matches are presented. See
[ADR-0003](./docs/adr/0003-three-level-display-not-binary.md) for the
rationale on why both modes coexist.

What gets detected (rules under [`src/detection/rules/`](./src/detection/rules/)):

- **clickbait_title** — uppercase shouting, listicles ("Top N",
  "10 Most Shocking …"), "you won't believe", emoji spam, repeated
  punctuation, screaming words.
- **rage_bait** — combat verbs ("DESTROYS", "humilié"), culture-war
  keywords, vs/contre/versus framings, outrage nouns.
- **brainrot_structural** — Shorts duration, emoji-spam patterns. The
  Shorts format alone is a soft signal; combined with another rule
  it tips into hide.
- **sensationalism** — mystery and hidden-truth phrasings, conspiracy
  keywords, hyperbolic superlatives, morbid / tragedy keywords for
  tabloid-style coverage.
- **harmful_kid_content** — Elsagate co-occurrences (kid character +
  disturbing word, suppressed by canonical-fiction context like
  movie/scene/gameplay) and named dangerous challenges (Tide Pod,
  Blackout, Skull Breaker, …).

**No API keys**, no backend, no telemetry. Detection runs entirely in
your browser. See the full
[privacy policy](./docs/PRIVACY.md).

## Tech stack

- TypeScript 5 strict
- Vite + [`@crxjs/vite-plugin`](https://crxjs.dev/) for Manifest V3
- React 18 (popup)
- Vitest + Testing Library (unit)
- Playwright (empirical regression harness)
- ESLint 9 (flat config) + Prettier
- Husky + lint-staged
- GitHub Actions (CI: lint, format, typecheck, test, build)

## Development

Requires Node ≥ 20 and npm.

```bash
npm install
npm run dev          # vite dev with HMR
npm run build        # production build → dist/
npm run typecheck
npm run lint
npm test
```

To load the extension in Chrome:

1. `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `dist/` folder

### Single-page diagnostic

`scripts/diagnose.mjs` launches Chromium with the unpacked extension,
loads one URL, and dumps the masking decisions and a screenshot.

```bash
npm run build
node scripts/diagnose.mjs                                   # default query
node scripts/diagnose.mjs "https://www.youtube.com/..."     # custom URL
# Output → diagnose-output/page.png and diagnose-output/logs.txt
```

### Empirical regression suite

`scripts/regression-test.mjs` walks ~18 fixed YouTube queries and
writes a markdown report comparing each query's actual masking ratio
against expected macro thresholds.

```bash
npm run build
node scripts/regression-test.mjs
# Output → diagnose-output/regression-report.md
```

Run this before every release. The expected output ends with
`16/18 queries pass`.

## Project layout

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

tests/                # 10 test files, 124 tests total
scripts/              # diagnose, regression-test, icon/promo generators
docs/
├── PRIVACY.md
└── adr/              # 7 architecture decision records
store-assets/         # listing copy, screenshots, promo tile, submission README
```

## Roadmap

- [x] Phase 0 — Bootstrap
- [x] Phase 1 — V0 heuristics + UI masking
- [x] Phase 1.5 — Polishing pass (icons, ADRs, regression suite, hide-all mode)
- [x] Phase 4 (prep) — Chrome Web Store submission package ready in
      [`store-assets/`](./store-assets/)
- [ ] Phase 4 (publish) — submit and ship
- [ ] (deferred) Phase 2 — Local ML classifier (transformers.js +
      DistilBERT). Skipped for V0 — heuristics + the regression-driven
      tuning hit the quality bar without the 30 MB model download.
- [ ] Phase 3 — Personalisation (per-channel learning, stats)
- [ ] Phase 5 — Firefox port

## Quality bar

Two harnesses must be green before any rule change ships:

- **Synthetic** — `tests/regression-corpus.test.ts`, ~60 curated titles
  with an `expected` display band. Runs in CI. **60/60 currently pass.**
- **Empirical** — `node scripts/regression-test.mjs` walks ~18 real
  YouTube searches and asserts macro thresholds per query.
  **16/18 currently pass.** The two accepted limitations are
  documented in [ADR-0006](./docs/adr/0006-regression-test-strategy.md).

## Not a parental control

SanityTV's `harmful_kid_content` rule does mask Elsagate-style content
and named dangerous challenges, but **this is not a substitute for a
parental control**. A determined adversary defeats heuristic filters
trivially. For real protection of a child's YouTube experience, use
[YouTube Kids](https://www.youtubekids.com/) or a dedicated parental
control product. See
[ADR-0007](./docs/adr/0007-not-a-parental-control.md).

## Architecture decisions

The major design decisions are documented as ADRs under
[`docs/adr/`](./docs/adr/):

- [ADR-0001](./docs/adr/0001-no-byok-no-embedded-keys.md) — No BYOK, no embedded API keys
- [ADR-0002](./docs/adr/0002-sum-aggregation-not-mean.md) — Aggregate signals by sum, not weighted mean
- [ADR-0003](./docs/adr/0003-three-level-display-not-binary.md) — Three-level display strategy
- [ADR-0004](./docs/adr/0004-dom-dedup-via-data-attribute.md) — DOM dedup via attribute marker
- [ADR-0005](./docs/adr/0005-shorts-format-not-inherently-brainrot.md) — Shorts format ≠ brainrot
- [ADR-0006](./docs/adr/0006-regression-test-strategy.md) — Regression test strategy (synthetic + empirical)
- [ADR-0007](./docs/adr/0007-not-a-parental-control.md) — Not a parental control

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)

# SanityTV

> A Chrome extension that filters YouTube videos exploiting attention-engineering patterns: clickbait, rage-bait, brainrot/low-effort content, and sensationalism.

**Status:** Phase 1 V0 working. Validated end-to-end: on a clickbait-heavy
search (`TOP+10+SHOCKING+DESTROYS`), 21 / 24 results are masked. On a
serious-creator search (`veritasium`), only 1 / 17 is flagged (a Short
with `?!` punctuation). Phase 2 (local ML model) is the next milestone.

## Why

The YouTube ecosystem optimizes for watch time, not for what's good for you. Existing extensions like [Unhook](https://unhook.app/) hide UI elements (Shorts, sidebar, recommendations) but don't classify the content itself. SanityTV combines UI cleaning with **automatic multi-signal classification** of the content to give you a YouTube that respects your attention.

## Approach

SanityTV scores each video on signals (title patterns, thumbnail cues, structural hints) and applies one of three actions based on the aggregated score:

- `< 30` → shown normally
- `30–60` → greyed out with a `⚠ sensational content` badge (still clickable)
- `> 60` → hidden (with an "show anyway" + "why?" override)

Detection ships in three increments:

1. **V0 — Heuristics only**: regex on titles, structural rules (duration, channel upload rate), basic thumbnail color analysis. Zero network, zero ML.
2. **V1 — Local ML**: DistilBERT (quantized, ~30 MB) running in-browser via [`transformers.js`](https://huggingface.co/docs/transformers.js). Still zero network after first download.
3. **V2 — Personalization**: per-channel whitelisting/blacklisting and threshold tuning based on user feedback.

**No API keys**, no backend, no telemetry.

## Tech stack

- TypeScript 5+ (strict)
- Vite + [`@crxjs/vite-plugin`](https://crxjs.dev/) for Manifest V3 builds
- React 18 (popup + options page)
- Zustand (state)
- Vitest + Testing Library (unit)
- ESLint 9 (flat config) + Prettier
- Husky + lint-staged
- GitHub Actions (CI: lint, typecheck, test, build)

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

### End-to-end diagnostic

`scripts/diagnose.mjs` launches Chromium with the unpacked extension,
loads a YouTube URL (default: a clickbait-heavy search), and dumps the
masking decisions plus a screenshot. Useful when iterating on rules.

```bash
npm run build
node scripts/diagnose.mjs                                   # default query
node scripts/diagnose.mjs "https://www.youtube.com/..."     # custom URL
# Output → diagnose-output/page.png and diagnose-output/logs.txt
```

To load the extension in Chrome:

1. `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `dist/` folder

## Project layout

```
src/
├── background/   # MV3 service worker
├── content/      # Content scripts injected on YouTube pages
├── detection/
│   ├── rules/    # V0 heuristics
│   ├── ml/       # V1 local model (transformers.js)
│   └── scorer.ts # Signal aggregation
├── popup/        # React popup app
├── options/      # React options page
├── storage/      # chrome.storage abstraction
└── types/
```

## Roadmap

- [x] Phase 0 — Bootstrap
- [x] Phase 1 — V0 heuristics + UI masking
- [ ] Phase 2 — V1 local ML classifier
- [ ] Phase 3 — Personalization (whitelist, learning, stats)
- [ ] Phase 4 — Chrome Web Store submission
- [ ] Phase 5 — Firefox port + thumbnail vision model

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
control product. See [ADR-0007](./docs/adr/0007-not-a-parental-control.md).

## Architecture decisions

The major design decisions are documented as ADRs under
[`docs/adr/`](./docs/adr/):

- [ADR-0001](./docs/adr/0001-no-byok-no-embedded-keys.md) — No BYOK, no embedded API keys
- [ADR-0002](./docs/adr/0002-sum-aggregation-not-mean.md) — Aggregate signals by sum, not weighted mean
- [ADR-0003](./docs/adr/0003-three-level-display-not-binary.md) — Three-level display strategy
- [ADR-0004](./docs/adr/0004-dom-dedup-via-data-attribute.md) — DOM dedup via attribute marker
- [ADR-0005](./docs/adr/0005-shorts-format-not-inherently-brainrot.md) — Shorts format ≠ brainrot
- [ADR-0006](./docs/adr/0006-regression-test-strategy.md) — Regression test strategy (50/50 synthetic + empirical)
- [ADR-0007](./docs/adr/0007-not-a-parental-control.md) — Not a parental control

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)

# SanityTV

> A Chrome extension that filters YouTube videos exploiting attention-engineering patterns: clickbait, rage-bait, brainrot/low-effort content, and sensationalism.

**Status:** Phase 0 — bootstrap. Not yet functional. Detection engine ships in Phase 1.

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

- [x] Phase 0 — Bootstrap (this PR)
- [ ] Phase 1 — V0 heuristics + UI masking
- [ ] Phase 2 — V1 local ML classifier
- [ ] Phase 3 — Personalization (whitelist, learning, stats)
- [ ] Phase 4 — Chrome Web Store submission
- [ ] Phase 5 — Firefox port + thumbnail vision model

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)

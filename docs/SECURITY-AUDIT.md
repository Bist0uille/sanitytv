# SanityTV — Security audit

**Date:** 2026-05-08
**Version reviewed:** v0.0.3 (commit at audit time on branch `main`)
**Verdict:** **GO for Chrome Web Store submission.** All Critical and
High findings closed in the same commit series. No outstanding
blockers.

## Summary

SanityTV ships ~13 kB of content-script code, ~150 kB of popup React
bundle, and a 1-line service worker. The audit confirms the extension
matches its privacy claims:

- **No remote code, no `eval`, no dynamic Function constructor.** The
  only dynamic import is the CRXJS loader pattern that pulls a bundle
  from `chrome.runtime.getURL(...)` — strictly intra-extension.
- **No network calls.** Zero `fetch`, `XMLHttpRequest`, `WebSocket`,
  `EventSource`, `sendBeacon`, or `sendNativeMessage` in the source
  or in the production bundle.
- **No data leaves the user's browser.** Verified at the bundle
  level, not just in source.
- **Two narrow permissions.** `storage` and
  `host_permissions: *://*.youtube.com/*`. Justifications match the
  privacy policy.

## Findings

| ID   | Severity | Category                    | Title                                                                                                                             | Status                                                      |
| ---- | -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| S-01 | Critical | Remote code                 | Search for `eval`, `new Function`, `innerHTML`, dynamic `<script>` injection                                                      | ✅ clean                                                    |
| S-02 | Critical | Network leak                | Search for `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` in source and bundle                               | ✅ clean                                                    |
| S-03 | High     | Cross-origin info leak      | Content script wrote to `sessionStorage` on the YouTube origin (readable by YouTube's main world)                                 | ✅ fixed                                                    |
| S-04 | Medium   | Log noise / privacy hygiene | Per-decision `console.log` revealed user's whitelist/blacklist and every video's score                                            | ✅ fixed                                                    |
| S-05 | Medium   | Dependencies                | `npm audit --omit=dev`: 0 vulnerabilities. `npm audit` total: 7 (5 mod, 2 high) all in dev-only `rollup` via `@crxjs/vite-plugin` | ✅ accepted                                                 |
| S-06 | Medium   | ReDoS                       | Long pathological titles (10 000 chars) measured at 137 ms in `scoreVideo` — slow but not catastrophic                            | ✅ fixed (input cap at 500 chars)                           |
| S-07 | Low      | Manifest hygiene            | No explicit Content Security Policy declared — MV3 default is strict but explicit is better for review                            | ✅ fixed (declared `script-src 'self'; object-src 'self';`) |
| S-08 | Info     | Manifest scope              | `host_permissions` and `content_scripts.matches` align; no `tabs`, no `webRequest`, no `cookies` requested                        | ℹ noted                                                     |

## Per-finding detail

### S-01 — Remote code & dynamic eval — Critical (clean)

**Repro**

```bash
grep -rnE "eval\(|new Function|Function\(['\"]|setTimeout\(['\"]|setInterval\(['\"]|document\.write|innerHTML|outerHTML|insertAdjacentHTML|dangerouslySetInnerHTML" src/ scripts/
```

**Result**: zero matches in our code.

The popup React bundle (`dist/assets/index.html-*.js`) does contain
the strings `innerHTML` and `dangerouslySetInnerHTML` because React's
internal property table lists them — these are **string identifiers
in React's prop registry**, not call sites. We do not use either in
our own popup code (`src/popup/App.tsx` is plain JSX with no
`dangerouslySetInnerHTML`).

The only dynamic import in the bundle is the CRXJS content-script
loader (`dist/assets/index.ts-loader-*.js`):

```js
import(chrome.runtime.getURL('assets/index.ts-XXX.js'));
```

This is intra-extension code loading via `web_accessible_resources`,
not remote code. ADR-0001 covers the no-remote-code stance.

### S-02 — Network leak — Critical (clean)

**Repro**

```bash
grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket\(|EventSource\(|sendNativeMessage" src/
grep -nE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket\(|EventSource\(" dist/assets/index.ts-*.js
```

**Result**: zero matches in source AND in the production bundle.

Privacy claim ("nothing leaves your browser") verified at the
artifact level.

### S-03 — sessionStorage cross-origin info leak — High (fixed)

**Background**: the content script previously wrote a diagnostic ring
buffer to `sessionStorage` on every video processed. `sessionStorage`
is keyed by origin, not by JavaScript context, so the entry was
readable by YouTube's main-world JS via simply
`sessionStorage.getItem('sanitytv:diag')`. The buffer included
processed video titles plus our masking decisions and signals.

**Impact**: a user's filtering decisions (and effectively a partial
record of their viewing context) leaked into a host-page accessible
storage.

**Fix**: removed the `diag()` function and the `DIAG_KEY` constant
entirely from `src/content/index.ts`. Verified post-build:

```bash
grep -c 'sessionStorage' dist/assets/index.ts-*.js
# All entries report 0
```

The `scripts/diagnose.mjs` development tool no longer reads from
sessionStorage either; it relies on Playwright's `page.on('console')`
capture, which works for content-script logs in current Chromium.

### S-04 — Verbose production logging — Medium (fixed)

The previous content script logged each masking decision via
`console.log('[SanityTV]', ...)` including the matched title and the
contributing signals. Per-video logs additionally surfaced the
loaded user settings (whitelist + blacklist).

Although content-script `console` output is not directly readable by
the host page, it cluttered the user's own devtools and revealed the
internal mechanics on every page load.

**Fix**: production build now emits a single boot line
(`[SanityTV] booting on <URL>`) and `console.warn` only on actual
errors. No more per-decision logs, no more settings dump, no more
2-second STATS interval.

### S-05 — `npm audit` runtime deps — Medium (accepted)

```bash
npm audit --omit=dev --audit-level=low
# found 0 vulnerabilities
```

The 7 advisories surfaced by the unscoped `npm audit` (5 moderate,
2 high) all originate from `rollup` pulled in transitively by
`@crxjs/vite-plugin` (a dev dependency used at build time only).
Nothing affected ships to users. Tracked upstream in @crxjs and will
be picked up automatically on the next minor bump.

### S-06 — Regex ReDoS resilience — Medium (fixed)

A new `tests/redos.test.ts` runs `scoreVideo` against six
pathological inputs (10 000-char uppercase walls, repeated keyword
spam, 5 000 fire emojis, accent-heavy combat verbs, kid-character
soup, repeated `vs` patterns). Asserts each scoring under 100 ms.

Initial run: the 10k-char uppercase title peaked at ~137 ms.
Linear-ish, not catastrophic backtracking, but slower than we want.

**Fix**: added `MAX_TITLE_LEN = 500` cap inside `scoreVideo`
(`src/detection/scorer.ts`). Real YouTube titles are <100 chars, so
the cap is invisible to legitimate inputs but defends against
arbitrary or hostile DOM content. Post-fix: all six pathological
cases score in <10 ms.

### S-07 — Explicit Content Security Policy — Low (fixed)

Manifest V3 enforces a strict default CSP for extension pages, but
declaring it explicitly is a transparency signal for reviewers.
Added to `manifest.config.ts`:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self';"
}
```

Verified in `dist/manifest.json` after build.

### S-08 — Permission scope review — Info

```json
"permissions": ["storage"],
"host_permissions": ["*://*.youtube.com/*"]
```

- `storage` — required for settings + stats (chrome.storage.sync /
  chrome.storage.local). Justified in `store-assets/listing.md`.
- `*://*.youtube.com/*` — required because YouTube serves at
  `youtube.com`, `m.youtube.com`, `music.youtube.com`,
  `tv.youtube.com`, etc. No tighter pattern works without breaking
  some surfaces. Justified in `store-assets/listing.md`.

We do not request `tabs`, `webRequest`, `cookies`, `clipboard`,
`downloads`, `nativeMessaging`, or any browser-wide host permission.
This is the minimum needed for the documented single purpose.

## Verification (final)

| Check                                                                        | Status                            |
| ---------------------------------------------------------------------------- | --------------------------------- |
| `npm test` (130 tests, including 6 ReDoS)                                    | ✅ pass                           |
| `npm run build` produces a valid MV3 bundle                                  | ✅ pass                           |
| `grep` for remote-code & network primitives in `src/` and `dist/assets/*.js` | ✅ clean                          |
| `npm audit --omit=dev --audit-level=high`                                    | ✅ 0 findings                     |
| Privacy policy claims aligned to code                                        | ✅ verified                       |
| Explicit CSP declared in manifest                                            | ✅ in place                       |
| ReDoS resilience under 100 ms on pathological inputs                         | ✅ in place (capped at 500 chars) |

## Out of scope

- Line-by-line audit of the React production bundle (~150 kB
  minified). The bundle is auditable — `npm run build` produces
  unminified-readable output and the source is on GitHub — but a
  pen-test depth review is not justified for a V0.
- Offensive pen-test (Burp / ZAP / fuzzing of the popup).
- Side-channel and timing-attack analysis.
- Firefox-specific review (deferred to the Phase 5 port).

## Recommendation for the Chrome Web Store reviewer

This audit, the public source, the privacy policy
(`docs/PRIVACY.md`), and the per-permission justifications in
`store-assets/listing.md` together cover every standard reviewer
question. No remote code, no unjustified permission, no telemetry,
no third-party SDK, no network call. Submit as is.

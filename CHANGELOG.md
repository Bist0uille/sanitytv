# Changelog

All notable changes to SanityTV. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [0.0.3] — 2026-05-08

### Changed

- `hideShortsCompletely` is now ON by default. Out-of-the-box, the
  extension hides every Short and the Shorts shelf in search results.
  Users who want short-form videos back flip the toggle off.
- Popup version badge now reads `chrome.runtime.getManifest().version`
  instead of being hardcoded.

### Security

- Removed the `sessionStorage` diagnostic ring buffer from the content
  script (was readable by the YouTube origin). See SECURITY-AUDIT S-03.
- Stripped per-decision `console.log` calls in production. Boot info
  and `console.warn` errors only. See SECURITY-AUDIT S-04.
- Added an explicit Content Security Policy in the manifest:
  `script-src 'self'; object-src 'self';`. See SECURITY-AUDIT S-07.
- Added `MAX_TITLE_LEN = 500` cap inside `scoreVideo` to defend the
  regex engine against pathological inputs. See SECURITY-AUDIT S-06.
- Published `docs/SECURITY-AUDIT.md` documenting all 8 findings.

### Detection

- Added shock-adjective keywords (EN: disturbing, terrifying,
  horrifying, creepy, freaky, scariest, deadliest, chilling, brutal,
  savage; FR: terrifiant(e), horrifiant(e), effrayant(e), glaçant(e)).
- Hide all flagged videos by default — borderline matches disappear
  outright instead of being greyed (the soft-warning mode is still
  available via toggle).

### Tools

- `scripts/generate_screenshots.mjs` rewritten with longer waits and
  aggressive zoom-out (0.6) so the before/after delta is unmistakable.
- `tests/redos.test.ts` added — 6 pathological inputs assert
  scoring < 100 ms.

## [0.0.2] — 2026-05-08

### Added

- "Hide all flagged" toggle (default ON). Greys collapse into hides
  by default; soft-warning mode is opt-in.
- Logo integration: `store-assets/logo.png` drives icons + promo tile.

### Changed

- Aggregate signals by SUM (capped at 100), not weighted mean — the
  previous mean diluted strong signals across non-firing rules.
- Extension icons regenerated from the canonical logo.

## [0.0.1] — 2026-05-08

### Added

- Initial scaffolding: TypeScript, Vite, React, Manifest V3.
- 5 detection rules: clickbait_title, rage_bait, brainrot_structural,
  sensationalism, harmful_kid_content.
- Popup with active toggle, sensitivity slider, channel lists, hide-
  all-flagged toggle, hide-all-Shorts toggle, activity counters.
- Synthetic regression corpus (60 titles) + empirical Playwright
  harness (18 YouTube queries).
- Privacy policy, 7 ADRs, store listing assets, Chrome Web Store
  submission package.

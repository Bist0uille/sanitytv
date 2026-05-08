# ADR-0006 — Regression test strategy: 50/50 synthetic + empirical

**Status:** Accepted (pre-release polish)
**Date:** 2026-05-08

## Context

Before submitting V0 to the Chrome Web Store, we needed evidence that
the four-rule heuristic engine behaves consistently across content
categories the engineering team didn't explicitly design for. The
three Playwright runs done during Phase 1 (clickbait / Veritasium /
fait divers) were a proof-of-life, not a quality bar.

## Decision

Two complementary harnesses, run in opposite environments:

1. **Synthetic ground-truth corpus** (`tests/regression-corpus.test.ts`):
   ~60 hand-curated titles with an `expected` band (`normal | grey | hide`)
   and a category. Runs in CI. Stable. Asserts ≥ 90 % accuracy at the
   describe-level summary, and one assertion per item for fine-grained
   regression localisation.
2. **Empirical harness** (`scripts/regression-test.mjs`): launches
   Chromium with the unpacked extension, walks ~18 real YouTube search
   queries, captures `data-sanitytv` attributes per video, compares to
   per-query macro thresholds (e.g. `≥ 70 % flagged for clickbait-en-strong`,
   `≤ 15 % flagged for serious-veritasium`). Produces
   `diagnose-output/regression-report.md`.

Synthetic is authoritative for **rule logic**; empirical is
authoritative for **real-world distribution**. Both must be green.

## Consequences

- Phase A surfaced 12 gaps that Phase 1's three queries missed,
  notably FR clickbait under-scoring, gore-keyword non-stacking,
  unicode-apostrophe blindness in mystery patterns, and the entire
  Elsagate / dangerous-challenges category (→ new
  `harmful_kid_content` rule, ADR-0007).
- After Phase D refinements + Phase E.bis (new rule), the synthetic
  corpus passes 60/60 (100 %) and the empirical harness 16/18 (89 %).
- The two remaining empirical fails are accepted V0 limitations,
  documented below.

## Accepted V0 limitations

| Query                             | Result                          | Why accepted                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closer+magazine+people+scandale` | 13 % flagged vs ≥ 30 % expected | The query returns _journalism about_ tabloid magazines (CNews coverage, lawsuits, the Hollande affair), not actual tabloid content. The detector correctly preserves serious news; the threshold was wrong.                                                                                                      |
| `linux+vs+windows+benchmark`      | 25 % grey vs ≤ 20 % expected    | Tech benchmark titles legitimately combine `vs` patterns with brand acronyms (NVIDIA, INTEL) and emphatic words (FASTER, NEWEST). All flagged at grey only — never hidden. The 5 pp over-shoot is acceptable: users can whitelist channels they trust, and Phase 2 (local ML) will resolve via semantic context. |

## Override

Either harness should be re-run before any rule change ships to main.
A failing item in the synthetic corpus blocks merge unless the corpus
itself is updated in the same PR with a written rationale. A new gap in
the empirical harness requires either a fix or an entry in the
"Accepted V0 limitations" table above.

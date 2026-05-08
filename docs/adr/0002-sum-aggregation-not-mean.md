# ADR-0002 — Aggregate signals by SUM (capped at 100), not weighted mean

**Status:** Accepted (Phase 1)
**Date:** 2026-05-08

## Context

`scoreVideo(metadata, rules)` runs N rules and produces a single
0..100 score. The original V0 implementation used a weighted mean:

```ts
score = round(weightedSum / totalWeight); // totalWeight = sum of all rule weights
```

End-to-end testing on real YouTube search results revealed this gave
embarrassingly low scores. Example title `"Top 10 Shocking Scandal
Moments"` should be hidden:

- `clickbait_title` returned `40` (keyword "shocking" + listicle "top 10")
- `rage_bait` returned `25` (outrage noun "scandal")
- `brainrot`, `sensationalism` returned `0`

Mean across 4 rules: `(40 + 25 + 0 + 0) / 4 = 16`. Below the grey
threshold (30). Title displayed normally — wrong.

## Decision

Aggregate by SUM, capped at 100:

```ts
score = clamp(sum(signal.contribution for signal in firingSignals), 0, 100)
```

## Consequences

- A single very strong rule (e.g. clickbait_title returning 100) is
  enough to hide the video on its own. Rules self-cap to 100, so the
  ceiling stays bounded.
- Multiple moderate rules now stack constructively. The same title above
  now scores 65, correctly hidden.
- The previous test for `"Top 10 Shocking Scandal Moments"` retroactively
  goes from `kept score=16` → `hide score=65`. Verified empirically on
  YouTube search results: 21/24 of clickbait results masked, 0/18 of
  Veritasium results flagged.

## Rationale

The mean treats every rule as equally informative, even rules that
didn't fire. A non-firing rule contributes 0 and pulls the average
down. The mean is the right aggregator if _every_ rule independently
expresses an opinion about every video — but our rules are sparse
detectors that only "speak" when a pattern is present. Sum (capped)
behaves correctly under sparsity.

## Alternatives considered

- **Probabilistic combine** `1 - Π(1 - p_i)`: treats each rule as an
  independent probability. Mathematically clean but harder to reason
  about and tune; we don't have calibrated probabilities anyway.
- **Max**: the strongest signal wins. Simpler than sum but can't
  express the intuition that "moderate clickbait + moderate rage-bait
  = high concern" — they should stack.

## Trade-offs / risks

Sum can over-count when rules have correlated signals (e.g. both
`clickbait_title` and `rage_bait` partly fire on the same word). We
accept this; the cap at 100 limits the worst case, and individual rule
weights can be tuned if a specific co-occurrence proves problematic.

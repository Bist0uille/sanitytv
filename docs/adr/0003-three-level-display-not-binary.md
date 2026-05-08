# ADR-0003 — Three-level display strategy (normal / grey / hide), not binary

**Status:** Accepted (Phase 1)
**Date:** 2026-05-08

## Context

A score → action mapping for each video. The simplest design is binary:
hide or show. Tim flagged a recurring problem: serious creators
(Veritasium, Kurzgesagt, Hank Green) now adopt clickbait visual codes
(uppercase titles, exaggerated thumbnails) without being clickbait. A
binary classifier wrongly hiding their content would erode trust in the
extension and push users to disable it.

## Decision

Three levels, gated by two thresholds:

| score range               | action     | UX                                            |
| ------------------------- | ---------- | --------------------------------------------- |
| `score < greyAt`          | **normal** | shown normally                                |
| `greyAt ≤ score < hideAt` | **grey**   | dimmed + grayscale + ⚠ badge, still clickable |
| `score ≥ hideAt`          | **hide**   | `display: none` + override link in popup      |

Defaults: `greyAt=30`, `hideAt=60`. Both shift linearly with the user's
sensitivity slider (`thresholdsFromSensitivity`).

## Consequences

- Borderline detections (clickbait visual codes used by serious
  creators) end up greyed, not hidden. The user can still click through.
- A whitelist short-circuits the rules entirely for trusted channels —
  Veritasium-style false positives have an explicit escape hatch in the
  popup.
- The grey state requires CSS that survives YouTube's own styling. We
  use a high-specificity attribute selector `[data-sanitytv="grey"]`
  injected via the content script's stylesheet.

## Rationale

The cost of a false positive (hiding a good video) is much higher than
the cost of a false negative (showing a bad one) — bad content is just
ignored, while hidden good content is invisible and the user blames the
extension. Greying is a soft, reversible UI that reduces the cost of
imperfect classifiers.

## Alternatives considered

- **Binary hide-only**: rejected — too punitive for borderline cases.
- **Replace thumbnails with frames** (DeArrow-style): different feature,
  different ADR. We may add it later but it doesn't replace scoring.
- **Score visible as a badge on every video**: visually loud, distracts
  more than it helps. The badge appears only when an action is taken.

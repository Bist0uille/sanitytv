# ADR-0005 — The Shorts format is a soft signal, not a verdict

**Status:** Accepted (Phase 1)
**Date:** 2026-05-08

## Context

The `brainrot_structural` rule detects short-form videos via duration
(`durationSeconds < 60`). The first calibration weighted Shorts heavily
(55 / 80) so a Short alone would cross the grey threshold (30) and be
dimmed.

Empirical fallout: searching for `veritasium` greyed every single one
of his ~10 Shorts. Veritasium Shorts are legitimate, high-effort
content shared in the Shorts format; the user reaction would be
"the extension is broken". This violates Tim's stated requirement that
serious creators must not be flagged.

## Decision

A Short alone contributes a **non-zero but sub-threshold** signal:

- `durationSeconds < 30` → 35 (still below grey threshold of 30 by
  default-off-by-one — actually mildly above, but well below hide)
- `30 ≤ durationSeconds < 60` → 20 (clearly below grey threshold)

The format is a **prior**, not a **verdict**. A Short combined with any
other firing rule (clickbait keyword, rage verb, morbid keyword) easily
crosses 60 → hide; a Short alone is shown normally.

## Consequences

- Veritasium Shorts now pass through with score = 0..20: shown normally.
- `"Top 5 CRAZIEST Road Rage Moments Ever 😳🔥"` Short → clickbait 65 +
  brainrot 35 = 100 → hidden, as desired.
- A pure low-effort Short with no semantic clickbait tells (no keywords,
  no rage verbs, no morbid words) is _not_ flagged. We accept this:
  there's currently no way to distinguish it from a Veritasium-style
  short without semantic analysis (Phase 2 ML).

## Rationale

The format itself is morally neutral. The signal is in **what's done
with the format**. Penalising the format penalises the creator, not
the content; the user's perception of the extension's quality depends
on respecting that distinction.

## Future work

Phase 2 (local ML) is the right place to classify the _content_ of a
Short rather than its container. Until then, users who categorically
want all Shorts hidden should be able to do so via a dedicated toggle
in the popup — to be added in a follow-up ADR if requested.

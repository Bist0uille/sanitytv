# ADR-0004 — Deduplicate observed elements via `data-sanitytv-checked` attribute

**Status:** Accepted (Phase 1)
**Date:** 2026-05-08

## Context

The content-script observer sees the same DOM element multiple times:
the initial `visit(document)` plus subsequent MutationObserver
notifications when YouTube re-renders. We need to avoid re-running the
rules on already-processed elements.

The original V0 used a `WeakSet<Element>` inside the observer, marking
every element passed to the callback. End-to-end Playwright testing
revealed this poisoned shells: YouTube renders empty
`<ytd-video-renderer>` placeholders before the title hydrates, so
`extractMetadata` returns null, but the observer marked the shell as
"seen" anyway. When the title finally arrived, we never re-evaluated.

Concrete failure: on a `TOP+10+SHOCKING+DESTROYS` query, all 6
top-of-page videos were untagged despite being obvious clickbait —
their shells were poisoned.

## Decision

The observer is **stateless**: every visit and every mutation just
emits the matching elements. Deduplication moves into the content
script as an attribute marker `data-sanitytv-checked="1"`, set **only
after a successful metadata extraction**.

## Consequences

- Shells are retried on every observer pass until extraction succeeds.
- Once extraction succeeds, the attribute prevents repeat work.
- Within a single observer batch the same element can be passed to the
  callback more than once (once via the addedNode path, once via the
  parent's `visit()`). The attribute check absorbs that.
- The marker survives DOM moves but is lost when YouTube destroys and
  recreates the element — which is what we want for SPA navigation.

## Rationale

A single `WeakSet` couldn't distinguish "we tried but the data wasn't
ready" from "we processed and decided". An attribute makes the state
inspectable from DevTools and from the diagnostic harness, and it
naturally lives on the element it describes.

## Alternatives considered

- Track `(element, videoId)` pairs and re-evaluate when videoId
  changes. Heavier; deferred until we observe YouTube re-binding the
  same DOM node to a different video.
- Re-evaluate every element every batch. Wastes work; would need an
  output cache anyway.

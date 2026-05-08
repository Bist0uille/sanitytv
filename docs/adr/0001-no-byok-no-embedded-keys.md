# ADR-0001 — No BYOK, no embedded API keys

**Status:** Accepted (Phase 0)
**Date:** 2026-05-08

## Context

SanityTV needs to score every YouTube video the user encounters. The
"obvious" architectures are:

1. **Embed an API key** for an LLM provider (Anthropic / OpenAI) inside
   the extension bundle. The extension calls the provider directly from
   the user's browser.
2. **BYOK** (Bring Your Own Key): the extension prompts each user for
   their own API key.
3. **Operator-hosted backend** that we run.
4. **Local-only inference** (heuristics + on-device ML).

## Decision

**Local-only inference. No API keys.**

We forbid (1), (2), and (3) for the V0 / V1 timeframe.

## Consequences

- Detection capability is bounded by what can run in the browser:
  regex/heuristics today; quantized transformer (~30 MB) via
  `transformers.js` in V1. We accept the lower ceiling.
- Zero recurring cost. Zero RGPD scope. Zero hosting to operate. The
  project can survive indefinitely without funding.
- Detection logic is shipped in plaintext in the extension bundle and
  fully auditable by users.

## Rationale

(1) is fatal: a public Chrome extension's bundle is unminified-readable
in seconds; any embedded key is extracted, abused, billed, then revoked
within hours of the first install spike.

(2) is friction: Tim explicitly framed the product as "I download it and
it works directly". Asking each user to obtain and paste an API key
breaks that promise and excludes most of the audience.

(3) is a different product: it requires legal entity, hosting budget,
abuse mitigation, GDPR data-processor agreements, and a monetisation
plan. None are aligned with shipping the V0.

## Override

If a future feature genuinely cannot be expressed as a local heuristic
or local model, the team must (a) revisit this ADR explicitly and
(b) propose a successor ADR before any networked classification is
introduced.

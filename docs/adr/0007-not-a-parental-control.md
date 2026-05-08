# ADR-0007 — SanityTV is not a parental control

**Status:** Accepted (pre-release polish)
**Date:** 2026-05-08

## Context

Phase E.bis added a `harmful_kid_content` rule that detects two known
patterns of YouTube content harmful to children:

1. **Elsagate**-style co-occurrence: a well-known kid character (Elsa,
   Peppa, Cocomelon, Spider-Man, …) plus a disturbing word (pregnant,
   kiss, murder, cursed, …), unless the context is canonical fiction
   (movie, episode, gameplay).
2. Named **dangerous challenges** that have caused real-world harm
   (Tide Pod, Blackout, Skull Breaker, Cinnamon, Salt-and-Ice, Knockout,
   Pass-out, Bird Box, Momo, Blue Whale, Kylie Jenner, NyQuil, …).

Empirically the rule hides 8/12 results on `elsa+spiderman+pregnant`
and 16/24 on `tide+pod+challenge`, while leaving 21/22 of legitimate
Peppa Pig results untouched.

This is real protection — but a determined predator who renames their
content (`"Frosen E. preg-nant"`, novel challenges) defeats it
trivially.

## Decision

**SanityTV is not a parental control. It is a heuristic content
filter that incidentally helps with a known, finite set of kid-harmful
patterns.** This must be communicated unambiguously:

1. The README's status / kid-section explicitly states this.
2. The popup's "Hide all Shorts" hint and any future kid-focused UI
   includes the same disclaimer.
3. We do **not** use marketing language like "child-safe", "kids
   mode", "parental controls", or "family-friendly" anywhere in
   product copy or store listing.

When asked "can I rely on this for my child", the answer is always
"no — use [YouTube Kids](https://www.youtubekids.com/) or a dedicated
parental control product. SanityTV is a defence-in-depth layer at
best, never a primary safeguard."

## Consequences

- The rule ships, with a non-trivial set of patterns covered.
- Marketing copy stays narrow ("a clean YouTube" — about attention,
  not children).
- We don't accept feature requests framed as "make this safer for my
  kid". The correct answer is to point at YouTube Kids.

## Override

The rule itself is fair game to extend (more characters, more
challenges, better suppressions). The product positioning is not — any
proposal to market SanityTV as a child-protection tool requires
revisiting this ADR explicitly.

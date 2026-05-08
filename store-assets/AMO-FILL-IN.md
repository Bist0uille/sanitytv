# Mozilla Add-ons (AMO) — fill-in sheet

Copy-paste each block into the matching field at
<https://addons.mozilla.org/developers/>.

The submission flow is: account → "Submit a new add-on" → upload XPI
→ fill the listing → optionally upload source → submit.

---

# 0. Upload

Upload the Firefox build at the project root:

    /home/koelephant/Documents/EXTENSION_SANITYTV/sanitytv-firefox-v0.0.3.zip

(`.zip` and `.xpi` are interchangeable — AMO accepts either.)

When asked **"How will the add-on be distributed?"** :

- **On this site** → public AMO listing (recommended).
- **Self-hosted** → for soft launch by direct link only.

---

# 1. Listing fields

## Name

```
SanityTV — A clean YouTube
```

## Summary (max 250 chars)

```
Filter YouTube videos exploiting clickbait, rage-bait and sensationalism. 100% local, no tracking, no API key. Open source under MIT.
```

## Description (long, supports basic HTML)

```
SanityTV gives you a calmer YouTube by filtering out videos that
exploit your attention through clickbait, rage-bait, sensationalism,
brainrot patterns, or content harmful to children.

WHAT IT DOES
SanityTV scores each video on the YouTube home, search, and sidebar
using a transparent set of heuristics. By default, any video that
crosses the threshold disappears from your feed — you simply see
fewer videos.

Prefer a softer experience? Turn off "Hide all flagged" in the popup
and borderline matches will be greyed-out with a warning badge
instead, still clickable. You can also adjust the sensitivity
slider, or turn the filter off entirely with one click.

WHAT IT DETECTS
  • Clickbait titles (uppercase shouting, listicles, "you won't
    believe", emoji spam, repeated punctuation)
  • Rage-bait (combat verbs like "DESTROYS", culture-war keywords,
    confrontation framings)
  • Sensationalism (mystery patterns, conspiracy keywords, hidden-
    truth narratives, morbid keywords for tabloid-style coverage)
  • Brainrot signals (Shorts duration, emoji spam)
  • Harmful kid content (Elsagate-style co-occurrences, named
    dangerous challenges like Tide Pod or Blackout)

It works in English and French out of the box.

WHAT IT DOES NOT DO
  • No data leaves your browser. Ever.
  • No third-party servers, no telemetry, no analytics.
  • No API key required.
  • Does not modify the YouTube video player itself.
  • Is not a parental control. Use YouTube Kids for that.

FOR THE CURIOUS
The full source code is on GitHub. Every detection rule is a few
dozen lines of TypeScript you can read. The architecture decisions
are documented as ADRs in the repo. The extension passes 130 unit
tests and 16/18 empirical tests against real YouTube searches before
each release.

PRIVACY
SanityTV does not collect, transmit, or sell any data. Independent
security audit at:
https://github.com/Bist0uille/sanitytv/blob/main/docs/SECURITY-AUDIT.md

SOURCE
https://github.com/Bist0uille/sanitytv

REPORT BUGS / ASK FOR FEATURES
Open an issue on the GitHub repository above.
```

## Categories

`Privacy & Security` (primary) — alternatively `Other`. AMO allows
two; pick `Privacy & Security` then `Other`.

## Tags

```
youtube, clickbait, focus, attention, productivity, content-filter, privacy
```

## License

```
MIT License
```

## Privacy policy URL

```
https://bist0uille.github.io/sanitytv/PRIVACY.html
```

## Support email

```
contact.sanitytv@gmail.com
```

## Support website

```
https://github.com/Bist0uille/sanitytv/issues
```

## Default locale

```
English (US)
```

(French listing can be added as a translation after the initial review.)

---

# 2. Reviewer notes (the "Notes to reviewers" field)

Paste this in the dedicated reviewer-notes box. It saves the AMO
reviewer 30 minutes by surfacing the answers to their default
questions:

```
Hi reviewer, thanks for taking a look. A few pointers to make this fast:

CODE QUALITY
- Source: https://github.com/Bist0uille/sanitytv (commit referenced in
  the source ZIP)
- Build instructions: docs/AMO-BUILD.md in the source ZIP — pure
  TypeScript + Vite + @crxjs/vite-plugin, no remote scripts, no
  network calls.

PRIVACY
- We make ZERO network calls. Verified at the bundle level in
  docs/SECURITY-AUDIT.md (finding S-02, grep over the production
  bundle for fetch/XHR/WebSocket/EventSource/sendBeacon).
- We declare browser_specific_settings.gecko.data_collection_permissions
  = ["none"] in the manifest.

PERMISSIONS
- `storage` — to persist user settings (toggles, slider, channel
  whitelist/blacklist) and a small local stats counter.
- `*://*.youtube.com/*` — to inject the content script that scores
  the visible video listings on YouTube. We do not request access to
  any other host.
- No other permissions, no `tabs`, no `webRequest`, no `cookies`.

WHAT THE EXTENSION DOES, MECHANICALLY
- The content script reads the title/channel/duration of each video
  card on YouTube's home and search pages.
- It scores the title against five rule modules under
  src/detection/rules/.
- It applies a CSS class on the renderer element to dim or hide it.
- That's it. Nothing else.

PRIVACY POLICY
https://bist0uille.github.io/sanitytv/PRIVACY.html

INDEPENDENT SECURITY AUDIT
https://github.com/Bist0uille/sanitytv/blob/main/docs/SECURITY-AUDIT.md
```

---

# 3. Source code submission (mandatory if AMO asks)

AMO often requires the bundled-and-minified source plus the
unminified source. We ship a clean repo:

1. From the project root:

   ```bash
   git archive --format=zip -o sanitytv-source-v0.0.3.zip HEAD
   ```

   This creates a clean ZIP of the repository at the current commit,
   excluding `node_modules`, `dist-*`, build artifacts, and
   `.secrets/`.

2. Upload `sanitytv-source-v0.0.3.zip` when AMO asks for source.

3. In the build instructions field, paste:

   ```
   See docs/AMO-BUILD.md inside the source ZIP. TL;DR:
     node ≥ 20
     npm install
     BROWSER=firefox npm run build
   Output: dist-firefox/ — same byte-identical content as the
   submitted XPI.
   ```

---

# 4. Promo & screenshots

| Field                                      | File                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Icon (no fixed size, 256×256+ recommended) | `public/icons/icon-128.png` (or upload `store-assets/logo.png` for higher resolution) |
| Screenshot 1                               | `store-assets/screenshots/00-clickbait-before.png`                                    |
| Screenshot 2                               | `store-assets/screenshots/01-clickbait-after.png`                                     |
| Screenshot 3                               | `store-assets/screenshots/03-popup-ui.png`                                            |

---

# 5. After the review

Typical AMO review: **1 to 7 days**. The first review is sometimes
quicker than Chrome's because Mozilla's auto-tooling does most of
the work for small extensions.

Common follow-up questions and the answer:

| Question                                                                | Answer                                                                                                                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What does the extension do at runtime?                                  | "Reads visible video titles/channels/durations on YouTube pages, scores them locally with regex heuristics, applies a CSS class to dim or hide cards. Nothing else." |
| Does it make any external requests?                                     | "No. Verified at the bundle level in docs/SECURITY-AUDIT.md (finding S-02)."                                                                                         |
| Why two `host_permissions` shapes (manifest + content_scripts.matches)? | "Required by Manifest V3 to inject the content script. Both pinned to _://_.youtube.com/\*."                                                                         |
| How can I rebuild and verify?                                           | "Source ZIP attached + docs/AMO-BUILD.md. `BROWSER=firefox npm run build` produces a byte-identical dist-firefox/ on Node 20+."                                      |

---

# 6. After publication

- [ ] Tag the GitHub release: `git tag firefox-v0.0.3 && git push --tags`
- [ ] Add the AMO install link to the README
- [ ] Watch <https://addons.mozilla.org/firefox/addon/sanitytv/> for
      reviews

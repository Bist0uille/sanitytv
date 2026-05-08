# Chrome Web Store — fill-in sheet

Copy-paste each block into the matching field of the dev console form.
Sections follow the Chrome Web Store form tabs.

---

# 0. Package tab

Upload the ZIP at the project root:

    /home/koelephant/Documents/EXTENSION_SANITYTV/sanitytv-v0.0.3.zip

Constraints: ~104 KB, manifest at the ZIP root, version 0.0.3.

---

# 1. Store listing tab

## Title (max 75 chars)

```
SanityTV — A clean YouTube
```

## Summary / Short description (max 132 chars)

```
Filter YouTube videos exploiting clickbait, rage-bait and sensationalism. 100% local. No tracking. No API key. Free.
```

## Description / Long description (max 16000 chars)

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
SanityTV does not collect, transmit, or sell any data. See the full
privacy policy at the link in this listing.

SOURCE
https://github.com/Bist0uille/sanitytv

REPORT BUGS / ASK FOR FEATURES
Open an issue on the GitHub repository above.
```

## Category

```
Productivity
```

## Language

```
English
```

(Add `French` as a secondary localised listing later if you want.)

## Store icon (128×128 PNG)

    /home/koelephant/Documents/EXTENSION_SANITYTV/public/icons/icon-128.png

## Small promo tile (440×280 PNG)

    /home/koelephant/Documents/EXTENSION_SANITYTV/store-assets/promo-440x280.png

## Marquee promo tile (1400×560)

Skip. Optional.

## Screenshots (1280×800 PNG, in this order)

1.  /home/koelephant/Documents/EXTENSION_SANITYTV/store-assets/screenshots/00-clickbait-before.png
2.  /home/koelephant/Documents/EXTENSION_SANITYTV/store-assets/screenshots/01-clickbait-after.png
3.  /home/koelephant/Documents/EXTENSION_SANITYTV/store-assets/screenshots/03-popup-ui.png

## Homepage URL

```
https://github.com/Bist0uille/sanitytv
```

## Support URL

```
https://github.com/Bist0uille/sanitytv/issues
```

## Contact email

```
contact.sanitytv@gmail.com
```

---

# 2. Privacy practices tab

## Single purpose

```
SanityTV's single purpose is to filter YouTube video listings on youtube.com so the user sees fewer videos exploiting attention-engineering patterns (clickbait, rage-bait, sensationalism).
```

## Permission justification — `storage`

```
Used to persist user preferences (filter on/off, sensitivity slider, channel whitelist and blacklist, Hide-All-Shorts toggle) and a small local counter of hidden/greyed videos shown in the popup. Stored in chrome.storage.sync (settings) and chrome.storage.local (counters). Never transmitted off-device.
```

## Host permission justification — `*://*.youtube.com/*`

```
Used to inject the content script that reads visible video titles, channel names, and durations on YouTube pages, scores them against the rule engine, and applies a CSS class for the chosen treatment (normal / grey / hidden). The extension only operates on YouTube domains; it does not request access to any other site, and does not read account-bound data (watch history, subscriptions, comments, messages).
```

## Privacy policy URL

```
https://bist0uille.github.io/sanitytv/PRIVACY.html
```

## Data usage — every box is **No**

- Personally identifiable information → No
- Health information → No
- Financial / payment information → No
- Authentication information → No
- Personal communications → No
- Location → No
- Web history → No
- User activity → No
- Website content → No

## Three certifications at the bottom (check all three)

- [x] I do not sell or transfer user data to unrelated third parties.
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

---

# 3. Distribution tab

| Field      | Value                                          |
| ---------- | ---------------------------------------------- |
| Visibility | **Public** (or **Unlisted** for a soft launch) |
| Regions    | **All regions**                                |
| Pricing    | **Free**                                       |

---

# 4. Account / Trader status (top-right of dashboard)

If asked "Are you a trader?", choose:

```
I am not a trader
```

(unless you actually monetise SanityTV — you don't.)

---

# 5. After clicking Submit for review

Typical review: **1 to 7 days**. If Google emails follow-up
questions, paste the matching answer below.

## "Why does the extension need host_permissions for YouTube?"

```
The extension's single purpose is to filter video listings on youtube.com. The host permission lets us inject a content script that reads visible titles, channel names, and durations, scores them locally, and hides or dims the cards. We do not request access to any other domain and do not read account-bound data.
```

## "What data does the extension read?"

```
Visible video titles, channel names, and durations on YouTube pages. The data is processed in memory only — never written to disk, never sent off-device. See https://bist0uille.github.io/sanitytv/PRIVACY.html and the public security audit at https://github.com/Bist0uille/sanitytv/blob/main/docs/SECURITY-AUDIT.md.
```

## "Does the extension make any network calls?"

```
No. Verified at the production-bundle level — zero fetch / XMLHttpRequest / WebSocket / EventSource / sendBeacon. The check is documented as finding S-02 in https://github.com/Bist0uille/sanitytv/blob/main/docs/SECURITY-AUDIT.md.
```

## "Where is the privacy policy?"

```
https://bist0uille.github.io/sanitytv/PRIVACY.html
```

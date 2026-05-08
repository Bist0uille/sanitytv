# Privacy Policy — SanityTV

_Last updated: 2026-05-08_

SanityTV is a Chrome extension that filters YouTube videos exploiting
attention-engineering patterns (clickbait, rage-bait, sensationalism,
brainrot, harmful kid content). This document explains exactly what
SanityTV does and does not do with your data.

## Short version

**SanityTV does not collect, transmit, or sell any personal data.**

Everything happens on your device. No telemetry. No analytics. No
servers. No tracking pixels. No third-party SDKs. The extension's
entire source code is public on GitHub for anyone to audit.

## What data SanityTV reads

The extension reads the **titles, channel names and visible duration**
of YouTube videos that appear on pages you visit. It must read this
data to score each video and decide whether to show, grey out, or
hide it.

This happens entirely in your browser, in memory. The data is **never
sent anywhere**, **never written to disk**, and **never shared with us
or any third party**. The moment you close the tab, that data is gone.

## What data SanityTV stores

SanityTV uses Chrome's storage APIs to remember your settings on your
device:

- Whether the filter is on or off
- Your sensitivity slider value
- Your channel whitelist and blacklist
- The "Hide all Shorts" toggle
- Counters of how many videos were hidden / greyed (your stats)

This data is stored in:

- `chrome.storage.sync` — settings (synced across your own Chrome
  profiles by Google, only between your own devices, only if you have
  Chrome Sync enabled)
- `chrome.storage.local` — counters and stats (kept on this device
  only)

We never see this data. It belongs to you and to Chrome's storage
infrastructure.

## What data SanityTV does NOT do

- ❌ No data sent to any server (we don't have one)
- ❌ No analytics, no telemetry, no crash reporting
- ❌ No ads, no monetisation, no affiliate links
- ❌ No third-party SDKs of any kind
- ❌ No reading of your YouTube account, watch history, or
  subscriptions
- ❌ No tracking across websites
- ❌ No collection of your IP address, location, or device identifiers
- ❌ No use of cookies (other than YouTube's own that we do not touch)

## Permissions and why we ask for them

| Permission                                   | Why                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                    | Save your settings and stats locally on your device.                                                                                |
| `host_permissions` for `*://*.youtube.com/*` | Inject the content script that reads page titles and decides which videos to filter. We do not request access to any other website. |

That's it. No `tabs`, no `webRequest`, no `cookies`, no clipboard, no
downloads, no network access.

## Children's privacy

SanityTV is not designed for children and does not knowingly collect
data from anyone, regardless of age. It is also **not** a parental
control product — see
[our note on this](https://github.com/Bist0uille/sanitytv/blob/main/docs/adr/0007-not-a-parental-control.md).

## Source code

The full source code of SanityTV is available at
<https://github.com/Bist0uille/sanitytv>. You are encouraged to audit
it. If you find anything in the code that contradicts this document,
please open an issue.

## Changes to this policy

If we ever change this policy in a meaningful way, we will note it in
this file's revision history on GitHub and the "Last updated" date at
the top will change. Material changes will also be announced in the
release notes of the next extension version.

## Contact

For privacy questions, open an issue at
<https://github.com/Bist0uille/sanitytv/issues> or email the
maintainer (contact in the GitHub profile).

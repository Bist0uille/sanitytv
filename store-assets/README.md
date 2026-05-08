# Chrome Web Store submission — checklist

This folder contains everything needed to submit (and update) SanityTV
on the Chrome Web Store. Every text field is in
[`listing.md`](./listing.md). Visual assets sit next to it.

## Contents

```
store-assets/
├── README.md                ← this file (the workflow)
├── listing.md               ← every text field, EN + FR, ready to paste
├── logo.png                 ← canonical brand logo (1254×1254)
├── promo-440x280.png        ← small promotional tile
└── screenshots/
    ├── 00-clickbait-before.png        ← raw YouTube clickbait wall
    ├── 01-clickbait-after.png         ← same query with the extension on
    └── 03-popup-ui.png                ← popup with all controls
```

To regenerate any asset:

```bash
npm run build
node scripts/generate_screenshots.mjs
python3 scripts/generate_promo_tile.py
python3 scripts/generate_icons.py
```

---

## Step 0 — Pre-flight

- [ ] `npm test` — must be green (130/130).
- [ ] `npm run build` — `dist/` rebuilt, lint and typecheck clean.
- [ ] `node scripts/regression-test.mjs` — must end on `16/18 queries pass`.
- [ ] `dist/manifest.json` `version` matches what you want to ship
      (currently **0.0.3**, bump in `package.json` if you've already
      published this exact version).
- [ ] [`docs/SECURITY-AUDIT.md`](../docs/SECURITY-AUDIT.md) verdict
      reads **GO**.

---

## Step 1 — Privacy policy URL (already live)

GitHub Pages is enabled on the `/docs` source. The privacy policy is
served at:

> **`https://bist0uille.github.io/sanitytv/PRIVACY.html`**

Verified `HTTP/2 200` on 2026-05-08. Paste this URL into the developer
console when asked.

If you ever need to change the policy, edit `docs/PRIVACY.md` on
`main` and Pages auto-redeploys within ~60 seconds.

---

## Step 2 — Create the developer account (one-time)

1. Open <https://chrome.google.com/webstore/devconsole>.
2. Sign in with the Google account that should own the extension.
3. Pay the one-time **5 USD** registration fee.
4. Confirm your contact email.

---

## Step 3 — Package the extension

```bash
npm run build
cd dist
zip -r ../sanitytv-v0.0.3.zip .
cd ..
```

The ZIP must contain `manifest.json` at its root, **not** inside a
`dist/` subfolder. Chrome rejects nested zips.

---

## Step 4 — Create the store listing

In the developer console:

1. Click **Add new item**.
2. Upload `sanitytv-v0.0.3.zip`.
3. Fill in the **Store listing** tab using
   [`listing.md`](./listing.md):
   - Extension name
   - Short description (EN + FR)
   - Detailed description (EN + FR)
   - Category: **Productivity**
   - Language: **English** (primary), French (secondary)
4. Upload visual assets:
   - **Small promo tile**: `store-assets/promo-440x280.png`
   - **Screenshots** (1280×800), 3 frames in `store-assets/screenshots/`
5. **Privacy policy URL**:
   `https://bist0uille.github.io/sanitytv/PRIVACY.html`
6. **Support email**: pick a dedicated alias rather than your personal
   Gmail.
7. **Homepage URL**: `https://github.com/Bist0uille/sanitytv`

---

## Step 5 — Privacy practices

In the **Privacy practices** tab, copy the values from
[`listing.md`](./listing.md):

- **Single purpose** — paste the one-sentence statement.
- **Permission justifications** — paste the per-permission text for
  `storage` and `host_permissions: *://*.youtube.com/*`.
- **Data usage table** — every checkbox is **No**. We do not collect
  anything.
- Confirm:
  - Does NOT transmit data off-device.
  - Does NOT sell user data.
  - Does NOT use data for unrelated purposes.

If a reviewer challenges any of these later, point them at
[`docs/SECURITY-AUDIT.md`](../docs/SECURITY-AUDIT.md), which verifies
each claim against the production bundle.

---

## Step 6 — Distribution

- **Visibility**: **Public** (or **Unlisted** for a soft launch — you
  can flip later without re-review).
- **Geographic distribution**: **All regions**.
- **Pricing**: **Free**.

---

## Step 7 — Submit for review

Click **Submit for review** at the top of the dashboard.

Typical review: **1 to 7 days**. Google may email follow-up
questions. Common ones and how to answer:

| Question                                                    | Answer                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why does the extension need `host_permissions` for YouTube? | Paste the `host_permissions` justification from `listing.md`.                                                                                                     |
| What data is read?                                          | "Visible video titles, channel names, and durations on YouTube pages, processed in memory and never stored or transmitted. See PRIVACY.md and SECURITY-AUDIT.md." |
| Is anything sent to a server?                               | "No. The extension makes zero network calls. Verified at the bundle level in SECURITY-AUDIT.md."                                                                  |
| Where is the privacy policy?                                | `https://bist0uille.github.io/sanitytv/PRIVACY.html`                                                                                                              |

---

## Common rejection causes (and how we mitigate them)

| Cause                        | Status                                             |
| ---------------------------- | -------------------------------------------------- |
| Single purpose unclear       | ✅ Stated in listing + manifest description        |
| Excessive permissions        | ✅ Only `storage` + YouTube host                   |
| Remote code execution        | ✅ No `eval`, no remote scripts (audit S-01)       |
| Obfuscated source            | ✅ Unminified, audit-able bundle                   |
| Missing privacy policy       | ✅ Hosted on GitHub Pages                          |
| False data-usage declaration | ✅ Audit verifies all "No" answers (S-02)          |
| Trademark misuse             | ✅ "SanityTV" name; description says "for YouTube" |
| Misleading functionality     | ✅ Description matches behaviour exactly           |

---

## After publication

- [ ] Tag the release: `git tag v0.0.3 && git push --tags`
- [ ] Replace "coming soon" in the root README with the store URL
- [ ] Watch GitHub Issues for early feedback (templates already exist
      in `.github/ISSUE_TEMPLATE/`)
- [ ] Optionally share on r/chrome, r/digitalminimalism, FR tech
      Mastodon / Twitter
- [ ] Plan v0.0.4 from real-user reports

---

## Updating later (subsequent releases)

The cycle for any future release:

```bash
# 1. Code, test, lint
npm test && npm run build

# 2. Bump version (semver)
npm version patch        # 0.0.3 → 0.0.4
#  ^ bumps package.json + commits + tags automatically

# 3. Re-build (the manifest reads pkg.version)
npm run build

# 4. Re-zip
cd dist && zip -r ../sanitytv-v0.0.4.zip . && cd ..

# 5. Push the tag and any code changes
git push --follow-tags

# 6. In the dev console:
#    - Open the existing extension (NOT "Add new item")
#    - Tab "Package" → "Upload new package"
#    - Drop sanitytv-v0.0.4.zip
#    - Fill "What's new" with a one-line changelog
#    - Submit for review
```

Rules to keep in mind:

- The `manifest.json` `version` MUST strictly increase. Chrome rejects
  re-uploads with the same or a lower version.
- Listing-only changes (description, screenshots, tagline) don't need
  a code re-upload — edit the **Store listing** tab and resubmit.
- Adding or removing permissions triggers a longer re-review (up to
  two weeks). Justify the change in the "What's new" field.
- For risky updates, enable **Partial publishing** (slider 0-100%) to
  staged-rollout the update.

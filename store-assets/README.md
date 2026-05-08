# Chrome Web Store submission — checklist

This folder contains everything needed to submit SanityTV to the Chrome
Web Store. Follow the steps in order; each one tells you exactly what
to copy/paste into the developer console form.

## Contents

```
store-assets/
├── README.md                    ← this file
├── listing.md                   ← all the text fields (title, descriptions, justifications)
├── promo-440x280.png            ← the small promotional tile
└── screenshots/
    ├── 01-clickbait-filtered.png       ← grid showing greyed clickbait
    ├── 02-clickbait-deeper.png         ← scrolled view, more variety
    ├── 03-popup-ui.png                 ← the popup UI in full
    └── 04-creators-respected.png       ← Veritasium untouched
```

Regenerate any of them at will:

```
npm run build
node scripts/generate_screenshots.mjs
python3 scripts/generate_promo_tile.py
```

---

## Step 0 — Pre-flight

- [ ] `npm test` — must be green (123/123)
- [ ] `npm run build` — `dist/` rebuilt and lint/typecheck green
- [ ] `node scripts/regression-test.mjs` — must end on `16/18 queries pass`
- [ ] Verify `dist/manifest.json` has `version` matching the value you
      want to ship (currently `0.0.1` — bump if you've already
      published this version)

---

## Step 1 — Activate GitHub Pages for the privacy policy URL

The Chrome Web Store needs a publicly hosted privacy policy URL. The
cleanest way is to enable Pages on the repo:

1. Go to <https://github.com/Bist0uille/sanitytv/settings/pages>
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/docs`
4. Save
5. After a minute, the policy will be live at
   `https://bist0uille.github.io/sanitytv/PRIVACY.html`

> Note: GitHub serves Markdown as HTML automatically when Pages is
> enabled with the docs folder source. If for any reason it serves
> raw markdown, copy `docs/PRIVACY.md` to `docs/PRIVACY.html` wrapped
> in a minimal HTML shell — but the default usually just works.

If you don't want to enable Pages right now, the GitHub blob URL is
also accepted in practice:
`https://github.com/Bist0uille/sanitytv/blob/main/docs/PRIVACY.md`

---

## Step 2 — Create the developer account

1. Go to <https://chrome.google.com/webstore/devconsole>
2. Sign in with the Google account you want to own the extension
3. Pay the one-time **5 USD** developer registration fee
4. Verify your contact email when prompted

---

## Step 3 — Package the extension

1. Run `npm run build`
2. Compress the `dist/` directory contents into a ZIP:
   ```
   cd dist
   zip -r ../sanitytv-v0.0.1.zip .
   cd ..
   ```
3. Confirm the zip contains `manifest.json` at its root, **not** a
   `dist/` subfolder (Chrome rejects nested zips)

---

## Step 4 — Create the store listing

In the developer console:

1. Click **Add new item**
2. Upload `sanitytv-v0.0.1.zip`
3. Fill in the **Store listing** tab using `listing.md` for every field:
   - Extension name
   - Short description (EN + FR)
   - Detailed description (EN + FR)
   - Category: **Productivity**
   - Language: **English** (primary)
4. Upload assets:
   - **Small promo tile**: `store-assets/promo-440x280.png`
   - **Screenshots** (1280x800): the four files in `store-assets/screenshots/`
5. Privacy policy URL: paste the URL from Step 1
6. Support email: paste your support email
7. Homepage URL: `https://github.com/Bist0uille/sanitytv`

---

## Step 5 — Privacy practices

In the **Privacy practices** tab:

- Single purpose: copy from `listing.md` ("Single Purpose" section)
- For each requested permission, paste the matching justification
  from `listing.md` ("Permission justifications" section):
  - `storage`
  - `host_permissions: *://*.youtube.com/*`
  - `background.service_worker`
- Data usage: see the "Privacy practices declarations" table in
  `listing.md`. **All "Yes/No" answers should be "No"** — the
  extension does not collect anything.
- Confirm **the extension does not transmit any data** off-device
- Confirm **the extension does not sell user data**
- Confirm **the extension does not use user data for unrelated
  purposes**

---

## Step 6 — Distribution

In the **Distribution** tab:

- Visibility: **Public** (or **Unlisted** for a soft launch — you can
  flip it later without re-review)
- Geographic distribution: **All regions**
- Pricing: **Free**

---

## Step 7 — Submit for review

Click **Submit for review** at the top of the dashboard.

Typical review time: 1 to 7 days. Google may email you with questions.
Common follow-ups:

- Asking why you need `host_permissions` for YouTube → the answer is
  already in `listing.md`, paste it
- Asking for clarifications on what data you read → "We read titles,
  channel names and durations of videos shown on the page; we do not
  store, transmit, or sell any of this data; everything happens
  in-memory"
- Asking for the privacy policy URL → resend the GitHub Pages URL

---

## Common rejection causes (and how we avoid them)

| Cause                        | Status                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| Single purpose unclear       | ✅ Documented in listing                                                |
| Excessive permissions        | ✅ Only `storage` + YouTube host                                        |
| Remote code execution        | ✅ Everything is bundled, no `eval`, no remote scripts                  |
| Obfuscated source            | ✅ Unminified TypeScript + readable bundle                              |
| Missing privacy policy       | ✅ Hosted on GitHub Pages                                               |
| False data-usage declaration | ✅ Truthful: nothing collected                                          |
| Trademark misuse             | ✅ "SanityTV" doesn't include "YouTube"; description says "for YouTube" |
| Misleading functionality     | ✅ Description matches what the extension actually does                 |

---

## After publication

- [ ] Tag the GitHub release: `git tag v0.0.1 && git push --tags`
- [ ] Add the Web Store install link to the README
- [ ] Open issue templates are already set up in `.github/`
- [ ] Optionally announce on relevant communities (HN, Reddit r/chrome,
      r/digitalminimalism, French dev twitter)
- [ ] Plan v0.1.0: keyword expansion based on real user reports +
      Phase 2 ML if needed

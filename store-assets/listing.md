# Chrome Web Store listing — copy

The fields below are the exact text to paste into the Chrome Web Store
developer console. EN is the primary listing; FR is the optional
localised version.

---

## Extension name

`SanityTV — A clean YouTube`

(38 chars; max 75)

## Short description (EN)

> Filter YouTube videos exploiting clickbait, rage-bait and
> sensationalism. 100% local. No tracking. No API key. Free.

(120 chars; max 132)

## Short description (FR)

> Filtre les vidéos YouTube qui exploitent clickbait, rage-bait et
> sensationnalisme. 100% local. Sans tracking. Gratuit.

(124 chars; max 132)

---

## Detailed description (EN)

```
SanityTV gives you a calmer YouTube by filtering out videos that
exploit your attention through clickbait, rage-bait, sensationalism,
brainrot patterns, or content harmful to children.

WHAT IT DOES
SanityTV scores each video on the YouTube home, search, and sidebar
using a transparent set of heuristics, then applies one of three
treatments:
  • Score below 30: shown normally
  • Score 30 to 60: greyed out with a warning badge (still clickable)
  • Score 60 or above: hidden

You can adjust the sensitivity slider to be more or less aggressive,
or turn the filter off entirely with one click.

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
are documented as ADRs in the repo. The extension passes 123 unit
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

## Detailed description (FR)

```
SanityTV vous donne un YouTube plus calme en filtrant les vidéos qui
exploitent votre attention via clickbait, rage-bait, sensationnalisme,
brainrot, ou contenus nuisibles aux enfants.

CE QUE ÇA FAIT
SanityTV score chaque vidéo de la home, de la recherche et de la
sidebar YouTube avec un ensemble transparent d'heuristiques, puis
applique un des trois traitements :
  • Score < 30 : affichée normalement
  • Score 30 à 60 : grisée avec un badge d'avertissement (toujours
    cliquable)
  • Score ≥ 60 : masquée

Vous pouvez ajuster le curseur de sensibilité, ou désactiver le
filtre d'un clic.

CE QUE ÇA DÉTECTE
  • Titres clickbait (MAJUSCULES, listicles, "vous n'allez pas
    croire", spam d'emojis, ponctuation excessive)
  • Rage-bait (verbes de combat type "DÉTRUIT", mots-clés de guerre
    culturelle, framings de confrontation)
  • Sensationnalisme (patrons de mystère, mots-clés de conspiration,
    récits de "vérité cachée", mots morbides pour la presse choc)
  • Signaux de brainrot (durée Shorts, spam d'emojis)
  • Contenus nuisibles aux enfants (co-occurrences façon Elsagate,
    challenges dangereux nommés type Tide Pod ou Blackout)

Fonctionne en français et en anglais d'origine.

CE QUE ÇA NE FAIT PAS
  • Aucune donnée ne quitte votre navigateur. Jamais.
  • Pas de serveurs tiers, pas de télémétrie, pas d'analytics.
  • Aucune clé API à fournir.
  • Ne modifie pas le lecteur vidéo YouTube.
  • N'est PAS un contrôle parental. Utilisez YouTube Kids pour ça.

POUR LES CURIEUX
Le code source complet est sur GitHub. Chaque règle de détection est
quelques dizaines de lignes de TypeScript lisibles. Les décisions
architecturales sont documentées en ADRs. L'extension passe 123 tests
unitaires et 16/18 tests empiriques sur des recherches YouTube
réelles avant chaque release.

VIE PRIVÉE
SanityTV ne collecte, ne transmet et ne vend aucune donnée. Voir la
politique complète via le lien dans cette annonce.

SOURCE
https://github.com/Bist0uille/sanitytv

SIGNALER UN BUG / DEMANDER UNE FONCTIONNALITÉ
Ouvrez une issue sur le repo GitHub ci-dessus.
```

---

## Category

Productivity (primary) — alternatively "Social & Communication".

## Language(s)

English (primary), French.

## Single Purpose

> SanityTV's single purpose is to filter YouTube video listings on
> youtube.com so the user sees fewer videos exploiting attention-
> engineering patterns (clickbait, rage-bait, sensationalism).

(For the "Single Purpose" field of the developer console.)

---

## Permission justifications

For the "Permissions justification" section of the submission form,
paste each line below alongside the corresponding permission.

### `storage`

> Used to persist user preferences (filter on/off, sensitivity slider,
> channel whitelist and blacklist, Hide-All-Shorts toggle) and a small
> local counter of hidden/greyed videos shown in the popup. Stored in
> `chrome.storage.sync` (settings) and `chrome.storage.local`
> (counters). Never transmitted off-device.

### `host_permissions: *://*.youtube.com/*`

> Used to inject the content script that reads visible video titles,
> channel names, and durations on YouTube pages, scores them against
> the rule engine, and applies a CSS class for the chosen treatment
> (normal / grey / hidden). The extension only operates on YouTube
> domains; it does not request access to any other site, and does not
> read account-bound data (watch history, subscriptions, comments,
> messages).

### `background.service_worker`

> Empty service worker registered only to satisfy Manifest V3
> requirements; no background work is performed at runtime in V0.

---

## Privacy practices declarations

The Chrome Web Store form will ask you to check boxes for "Data
collection". Set them as follows:

| Category                            | Selection                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Personally identifiable information | **No**                                                                                                                                                             |
| Health information                  | **No**                                                                                                                                                             |
| Financial / payment information     | **No**                                                                                                                                                             |
| Authentication information          | **No**                                                                                                                                                             |
| Personal communications             | **No**                                                                                                                                                             |
| Location                            | **No**                                                                                                                                                             |
| Web history                         | **No**                                                                                                                                                             |
| User activity                       | **No**                                                                                                                                                             |
| Website content                     | Read-only access for processing — **not collected, not stored, not transmitted**. The relevant Chrome form question is "Do you collect website content?" → **No**. |

For "Why does this extension need each permission":

- Use the per-permission text above.

For "Has this extension ever sent or sold data to a third party": **No**.

---

## Privacy policy URL

`https://bist0uille.github.io/sanitytv/PRIVACY.html`
(after enabling GitHub Pages — instructions in `store-assets/README.md`)

Alternative if GitHub Pages is not enabled yet:
`https://github.com/Bist0uille/sanitytv/blob/main/docs/PRIVACY.md`

The Chrome Web Store accepts the GitHub blob URL in practice but
strongly prefers a hosted page. Pages activation is a one-click step
in the GitHub repo settings.

---

## Support email

To fill in. Suggest a forwarder or a dedicated alias rather than the
personal Gmail (e.g. `sanitytv@<your-domain>` or use GitHub's noreply
contact form).

---

## Promotional fields

| Field              | Size                  | Status                           |
| ------------------ | --------------------- | -------------------------------- |
| Small promo tile   | 440x280               | `store-assets/promo-440x280.png` |
| Marquee promo tile | 1400x560              | optional, can skip               |
| Screenshots        | 1280x800 (or 640x400) | `store-assets/screenshots/*.png` |

---

## Distribution

- **Visibility**: Public (default) or Unlisted (link-only) for an
  initial soft launch.
- **Geographic distribution**: All regions.
- **Pricing**: Free.

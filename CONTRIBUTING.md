# Contributing to SanityTV

Thanks for your interest. This document describes the workflow.

## Development setup

```bash
git clone git@github.com:Bist0uille/sanitytv.git
cd sanitytv
npm install
npm run dev
```

Node ≥ 20 is required.

## Branching

- `main` is always shippable. Direct pushes are discouraged once the project is stable.
- Feature branches: `feat/short-description`
- Bug fixes: `fix/short-description`
- Chores / tooling: `chore/short-description`

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add clickbait scoring for uppercase titles
fix(content): handle missing thumbnail gracefully
chore(deps): bump vite to 6.0.7
docs: clarify v0 heuristics in README
```

## Pull requests

Before opening a PR:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

Husky runs `lint-staged` on commit, so most issues will be caught earlier.

## Code style

- TypeScript strict mode is on. Don't disable it locally.
- No `any` unless explicitly justified in a comment.
- React function components only.
- One module = one responsibility. Detection rules live under `src/detection/rules/`, one file per signal.

## Testing

- Unit tests with Vitest live alongside or in `tests/`.
- For new detection rules, include a small fixture set with positive and negative examples.
- Don't mock YouTube DOM in unit tests — use real HTML snapshots when needed.

## Reporting bugs / suggesting features

Use GitHub Issues. Include:

- Browser version
- Extension version
- Reproducible steps
- Expected vs. actual behavior
- Screenshot if UI-related

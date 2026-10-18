# Chaalwise

A free, offline strategy gym. Learn to think ahead, calculate, weigh odds and plan, through chess now and poker next, against the computer only. No money, no multiplayer, no ratings, and your progress never leaves your device.

Live at [chaalwise.urbanmorph.com](https://chaalwise.urbanmorph.com).

## Layout

```
packages/core   lesson format, lesson player, spaced repetition (FSRS), on-device progress (IndexedDB)
apps/web        Astro site with Svelte 5 islands: the chess board (chessground), lessons, review, progress
                and the offline service worker
```

Lessons are Markdown files in `apps/web/src/content/lessons/`, with their steps as data. Every position and answer is checked with chessops at build time, so a broken lesson fails the build.

## Develop

Node 22 and pnpm 10.

```sh
pnpm install
pnpm dev          # local site
pnpm build        # build to apps/web/dist
pnpm test         # unit tests, plus tests that read the build (run pnpm build first)
pnpm test:e2e     # Playwright: offline use, deploy A to B, tombstone, review
pnpm lint         # Prettier and ESLint
pnpm check        # type checks
pnpm budget       # JavaScript budget per page
```

## Offline

The service worker fetches pages network-first, caches only content-hashed build files, and waits for the learner to accept an update. If caching ever goes wrong, `SW_TOMBSTONE=1 pnpm build` produces a build whose worker removes itself and every cache for every learner; progress in IndexedDB is kept.

## Deploy

Pushes to `main` deploy through GitHub Actions after every check passes. For a manual deploy, put the UrbanMorph account's `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.env` (never committed) and run `pnpm ship`.

## Licence and credits

AGPL-3.0. The board ([chessground](https://github.com/lichess-org/chessground)) and the chess rules ([chessops](https://github.com/niklasf/chessops)) come from the Lichess community, under GPL-3.0; Chaalwise is independent and not part of Lichess. Full credits are on the site's [credits page](https://chaalwise.urbanmorph.com/credits/).

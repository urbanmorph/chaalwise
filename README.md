# Chaalwise

A free, offline strategy gym. Learn to think ahead, calculate, weigh odds and plan, through chess, poker and game-theory labs, against the computer only. Poker uses free practice points that can never be bought, sold or cashed out. No money, no multiplayer, no ratings, and your progress never leaves your device.

Live at [chaalwise.com](https://chaalwise.com).

## Layout

```
packages/core   lesson format, lesson player, spaced repetition (FSRS), on-device progress (IndexedDB)
apps/web        Astro site with Svelte 5 islands: the chess board (chessground), lessons, review, progress
                and the offline service worker
tools/puzzles   build-time tool: the Lichess puzzle database to small theme chunks, cached in R2
```

Lessons are Markdown files in `apps/web/src/content/lessons/`: their reading and plan steps, and the questions they ask by id. Every question lives once in the corpus, `apps/web/src/content/questions/<game>/<idea>/<name>.yaml`, where `<game>` is `chess`, `poker`, `labs` or `life` (questions about life off the board). Lessons (`- ask: chess/fork/knight-takes-two`), reference entries (`try:`) and labs ask questions by id; review, course practice and mixed practice draw on the whole corpus by the skill each question `measures`. To add a question, add a file: it is checked at build time (every position and answer with chessops; a poker question's cards for a card dealt twice, and its hands, outs and odds by tests against the poker engine), and it is practised for its skill straight away. A question that existed before the corpus keeps its review card in `card`, so learners' progress carries over.

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

## Puzzle pipeline

`tools/puzzles` streams the [Lichess puzzle database](https://database.lichess.org/#puzzles) (zstd-compressed CSV, CC0), keeps popular, well-rated puzzles for a few beginner themes (mate in one, back-rank mate, hanging piece, fork, pin, skewer, discovered attack), 80 per theme in each rating band from 400 to 1600, replays each one with chessops and drops any that fail, and writes `puzzles/<theme>-<min>-<max>.<hash>.json` plus `puzzles/manifest.json`. It stops reading once every chunk is full. It needs the `zstd` command (`brew install zstd`; GitHub's Ubuntu runners have it), because the file is many zstd frames and Node's own decoder reads only the first.

```sh
pnpm --filter @chaalwise/puzzles puzzles --dry-run                   # everything stays in tools/puzzles/.cache
pnpm --filter @chaalwise/puzzles puzzles --dry-run --time-limit 2m   # stops cleanly; run again to carry on
```

- **Caching:** the checkpoint (rows read, puzzles kept) is saved to `tools/puzzles/.cache` and to the durable store every 10 minutes (`--checkpoint-every`) and again on exit, including on failure or Ctrl-C. Downloaded bytes are kept too.
- **Restart:** a run resumes from the furthest checkpoint, local or durable, and asks the server only for the bytes it does not have. It stops cleanly at `--time-limit` (default 5 hours, inside GitHub's 6-hour job limit) and exits with code 75 when it stopped early.
- **Idempotency:** a second run with the same source file (by ETag) and settings reads nothing, writes nothing and uploads nothing; uploads are skipped when the stored MD5 matches.
- **R2:** uploads happen only when `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET` are all set (for example `node --env-file=.env`); with none set, or with `--dry-run`, everything stays local, and half-set credentials are refused. Wrangler's login is never used. The GitHub workflow "Puzzle pipeline" runs it by hand only, with those four repository secrets.

## Licence and credits

AGPL-3.0. The board ([chessground](https://github.com/lichess-org/chessground)) and the chess rules ([chessops](https://github.com/niklasf/chessops)) come from the Lichess community, under GPL-3.0; Chaalwise is independent and not part of Lichess. Full credits, with each licence, are in [CREDITS.md](./CREDITS.md); the terms of use are in [TERMS.md](./TERMS.md).

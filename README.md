# Chaalwise

Free, short lessons in strategy and decision-making for people who run things, or are learning to. Eleven skills (thinking ahead, weighing odds, sizing a risk, keeping a cool head and more), each shown in chess, poker or a game-theory lab, used on work and study cases, and brought back by spaced review. Against the computer only, with no multiplayer and no ratings. Free to learn, offline, no account, no ads. Points are never for sale. Practice points can never be bought, sold or cashed out, and your progress never leaves your device.

What is there: 27 chess lessons, from the board to full games; 11 poker lessons, guided first hands, practice tables and poker drills; 14 game-theory labs; 31 strategy lessons and 6 work cases; daily chess drills and puzzles by theme; today's puzzles (one chess, one poker, every day, with a streak); review, practice and a skill profile; a reference of every idea; a printable pack for teams and classes.

Live at [chaalwise.com](https://chaalwise.com).

## Layout

```
packages/core   lesson format, lesson player, spaced repetition (FSRS), on-device progress (IndexedDB)
packages/teach  chess teaching helpers: positions, legal moves, practice generators
packages/poker  poker engine: cards, hand ranking, outs, odds and equity, the table and its bots
apps/web        Astro site with Svelte 5 islands: the chess board (chessground), lessons, labs, drills,
                review, progress and the offline service worker
apps/web/src/worker   the Worker for /api/count, the anonymous counts (D1, migrations/ in apps/web)
tools/puzzles   build-time tool: the Lichess puzzle database to small theme chunks, cached in R2
```

Lessons are Markdown files in `apps/web/src/content/lessons/`: their reading and plan steps, and the questions they ask by id. Every question lives once in the corpus, `apps/web/src/content/questions/<game>/<idea>/<name>.yaml`, where `<game>` is `chess`, `poker`, `labs` or `life` (questions about life off the board). Lessons (`- ask: chess/fork/knight-takes-two`), reference entries (`try:`) and labs ask questions by id; review, course practice and mixed practice draw on the whole corpus by the skill each question `measures`. To add a question, add a file: it is checked at build time (every position and answer with chessops; a poker question's cards for a card dealt twice, and its hands, outs and odds by tests against the poker engine), and it is practised for its skill straight away. A question that existed before the corpus keeps its review card in `card`, so learners' progress carries over.

A strategy lesson says what its game moment follows in `after:`: a chess or poker lesson (`poker/outs-and-odds`), another strategy lesson, or a lab (`labs/which-bag`). It sits on that game's path (those after labs are listed on the lab's page and the skill's course), and its chess, poker or lab questions are worked examples to read until the learner has met that game. Its compare question sets a case off the board (`alongside`) beside the game moment: a chessboard, poker cards, or, for a lesson after a lab, a round of the lab told in the prompt (`lab: <slug>`). Plans to use an idea this week end every strategy and poker lesson (a `kind: plan` step) and every lab (`apps/web/src/lib/labs/plans.ts`); review asks about them all the same way.

Two checks test whether an idea is spotted when nobody names it. **"Which idea fits?"** situations (`apps/web/src/content/fits/<idea>/<name>.yaml`: the situation, why the idea fits, and why each look-alike idea does not) open on the review page once three strategy lessons are finished; the learner picks among the ideas of lessons they have finished, and each situation is a review card (`fits/<idea>/<name>`). **Cases a week later** (`apps/web/src/content/later/<case>.md`, decisions in the corpus under `later/`) are offered by review seven days after their lesson or lab is finished, say which idea they tested only at the end, and are kept out of every other page; whether the learner used the idea is kept on the device, carried in the progress file, and shown on the progress page.

Lessons, reference entries and questions may say where they come from in `sources:`, a list of `{title, url?, licence, credit?}`, where `licence` is one of `own`, `public-domain`, `CC0`, `CC-BY`, `CC-BY-SA`, `CC-BY-NC`, `CC-BY-ND`, `permission` or `cited-idea` (an idea from a book or paper, in our own words, cited by name and year). They may also set `tier: paid` (the default is free). The build fails on a non-commercial source anywhere, and on a share-alike or no-derivatives source in paid content. The tests (`apps/web/test/sources.test.ts`) also count a question as paid when paid content asks it, and want a source wherever text cites research by its year.

## Develop

Node 22 and pnpm 10.

```sh
pnpm install
pnpm dev          # local site
pnpm build        # build to apps/web/dist
pnpm test         # unit tests, plus tests that read the build (run pnpm build first)
pnpm test:e2e     # Playwright: offline use, deploy A to B, tombstone, review
pnpm lint         # Prettier and ESLint
pnpm lint:prose   # plain-language checks on lessons (front matter too), questions, tracks and the reference (needs Vale 3 on your PATH; rules in tools/vale)
pnpm check        # type checks
pnpm budget       # JavaScript budget per page
```

## Offline

The service worker fetches pages network-first, caches only content-hashed build files, and waits for the learner to accept an update. If caching ever goes wrong, `SW_TOMBSTONE=1 pnpm build` produces a build whose worker removes itself and every cache for every learner; progress in IndexedDB is kept.

## Deploy

Pushes to `main` deploy through GitHub Actions after every check passes. For a manual deploy, put the UrbanMorph account's `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in `.env` (never committed) and run `pnpm ship`. The site is static files on Cloudflare Workers at chaalwise.com, served first; a small Worker (`apps/web/src/worker`) answers only `/api/count`.

## What is counted

Progress never leaves the device. The site counts two things, both anonymous: page visits, with Cloudflare Web Analytics (no cookies), and how often things are finished. When a lesson, lab, drill, practice hand or review round is finished, the page sends only its name, such as `played:labs/nim` (`apps/web/src/lib/count.ts`), and the Worker adds one to that name's daily total in the D1 database `chaalwise-metrics`. No ID, answer or anything about the learner is sent or stored. The schema is `apps/web/migrations/`; apply a new one with `pnpm --filter @chaalwise/web exec wrangler d1 migrations apply chaalwise-metrics --remote`.

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

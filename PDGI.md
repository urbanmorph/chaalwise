# How Chaalwise follows PDGI

[Chaalwise](https://chaalwise.urbanmorph.com) is built on the principles of [People's Digital Goods and Infrastructure (PDGI)](https://pdgi.org/blog/peoples-digital-goods-and-infrastructure/): people before digital, rights-centric, commons-oriented, transparent.

This is a public scorecard of how those principles are actually implemented, with links to the evidence and notes on where we fall short.

Status key: ✅ implemented · 🟡 partial · ⛳ gap, with intended direction.

## Scorecard

### People before digital (rights and collective identity) — ✅

Chaalwise teaches thinking skills, not a habit to sell. There is no money anywhere: no purchases, no prizes, and poker uses practice points that can never be bought, sold or cashed out. There are no ratings or leaderboards, so no learner is ranked against another; progress is a per-skill profile built from the learner's own play. Evidence: the [plan's hard rules](./CLAUDE.md), the app's footer promise, no payment code in this repository.

### Transparency and accountability — ✅

Open source under AGPL-3.0, an open repository, and the teaching content in the open as Markdown. Every claim a lesson makes about a position (that a move mates, that a move is safe) is checked by the chess rules and teaching helpers at build time, not taken on trust. Evidence: this repository, `apps/web/src/content/lessons`, `apps/web/test/lessons.test.ts`, this file's git history.

### Decentralisation and no lock-in — ✅

No account, no signup, no server holding learner data. Progress exports to a JSON file and imports on any device. The site is static files, so it can be self-hosted or forked. Evidence: the progress page's export and import, `packages/core/src/progress.ts`, the [AGPL licence](./LICENSE).

### Free software and the digital commons — ✅

AGPL-3.0 code. It builds on free software from the Lichess community (chessground and chessops, GPL-3.0), credited on the site and never presented as ours. Evidence: [LICENSE](./LICENSE), the [credits page](https://chaalwise.urbanmorph.com/credits/).

### Privacy — ✅

Learner progress never leaves the device: it lives in the browser's own storage. No ad-tech, no tracking cookies, no third-party requests (fonts come from the system). No analytics run today; if anonymous usage counts are added, they will be aggregate daily totals with no per-learner data, disclosed here first. Evidence: `packages/core/src/progress.ts`, `apps/web/test/dist.test.ts` (no external requests, no font downloads).

### Platform cooperativism — 🟡

Lessons are plain files anyone can read, improve or translate through a pull request. There is no contributor flow inside the app yet. Direction: a simple guide for contributing lessons and drill positions, checked by the same build-time rules.

### Humans in the loop (AI does not cut people out) — ✅

No AI decides anything. The chess rules engine and the teaching helpers decide what is true about a position; if an AI tutor is added later, it may only word explanations, never decide them. Evidence: the plan's "explains but never decides" rule, `packages/teach`.

### A non-digital alternative must exist — 🟡

Chess is played on a physical board with nothing but the rules, and every lesson's idea works there. The app works fully offline once loaded. But the lessons themselves are not yet printable. Direction: printable lesson sheets and drill cards for clubs and classrooms without devices.

### Grassroots and reaching the divide-affected — ⛳

Today Chaalwise is English only, though it is free, needs no account, and is built to run on mid-range phones over slow connections. Direction: lessons in Indian languages, starting with the most-used, written so that chess notation stays the same across languages.

### Algorithmic fairness — mostly not applicable

Chaalwise makes no decisions about people. The computer opponent's strength and the skill profile respond only to the learner's own play, and nothing is compared across learners.

## Fork this

Want to show your project follows PDGI? Map each principle to the concrete thing you do, link the evidence, and mark the gaps honestly. Copy this file as a template and keep it in your repo, where its git history becomes the record of your work.

Built by [Urban Morph](https://urbanmorph.com). PDGI framework: [pdgi.org](https://pdgi.org/).

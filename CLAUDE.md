# Chaalwise

A free, offline strategy-learning web app that teaches thinking skills through chess and poker, played against the computer only. No money, no multiplayer, no ratings.

## Start here

Read `supporting-docs/handover.md` first, then `supporting-docs/plan.md`.

The canonical plan is the mdshare document `KQDNOxQ3lD`. `supporting-docs/plan.md` is a snapshot of it; refresh the snapshot from mdshare before relying on it, and write plan changes back to mdshare.

## Repo discipline

- The repo is code only, plus `README.md`, `PDGI.md` (the public scorecard every UrbanMorph app carries) `CREDITS.md` (credits and licence notices, linked from the footer) and `TERMS.md` (the terms: a learning tool, not a gaming service, and never a money game, with the Act and Rules cited; GitHub issues are the grievance channel). Plans, research, mockups and notes go in `supporting-docs/`, which is gitignored.
- The look follows the UrbanMorph family: mdshare, twelveswaras and bharatlas (`~/GitHub/geodata`, see `web/scripts/shared-chrome.mjs`). Not rf-website or sc-app.
- Public repo, AGPL-3.0. Never commit secrets: `.env`, `.dev.vars` and Cloudflare tokens stay local.
- Deploy only with the UrbanMorph Cloudflare account, set explicitly for this project, never the ambient token.

## Development order, for every change

1. TDD: a failing test first, then the code.
2. Simplify.
3. Lint and format; fix every warning.
4. Verify: the full test suite, then the real behaviour end to end. Tests assert against built output, not source.
5. Code review: reuse, performance, best practices.

## Hard rules

- Poker stays an online social game under India's Online Gaming Act 2025: practice points are free and can never be bought, sold, cashed out or exchanged for prizes. No links, ads or referrals to real-money sites. Say "points", not "chips".
- Lichess code, puzzles and APIs are credited; the Lichess name and logo are never used as ours.
- Learner progress never leaves the device.
- The offline service worker follows the plan's rules (network-first HTML, only content-hashed files cached, a tested tombstone worker ready), because of SaralCare's 10 June 2026 stale-cache incident.
- Check both light and dark themes for any UI change.
- Every question and text names its setting: the game or sport it uses, and any jargon explained, because practice shows questions on their own. Boards draw the attacks and moves their text describes (`arrows`). A build test checks life questions for game terms without the game's name.

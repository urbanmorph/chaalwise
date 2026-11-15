---
title: Commit in stages
summary: Commit in proportion to your edge, a little at a time, and never so much that one loss ends the game.
game: strategy
stage: 5
order: 5
skills: [size-risk]
after: chess/middlegame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, White is thinking of attacking Black's king. Bxh7+ gives up the bishop for the pawn on h7, with check, to strip the king's cover. But the bishop is the only White piece near the king. If Black takes it (Kxh7), no White move gives check. White would have given three points for one, and would be two points down.
    position: r1bq1rk1/ppp2ppp/2n1p3/3p4/3P4/1QNBP3/PPP2PPP/R4RK1 w - - 0 1
    highlight: [h7]
    arrows: [d3h7, g8h7]
  - ask: chess/commit-in-stages/one-piece-attack
  - ask: chess/commit-in-stages/compare
  - kind: read
    id: off-the-board
    text: 'What both share has a name: size the risk. Commit in proportion to your edge, how far things favour you. Your edge is only a guess, so commit in stages: a little first, then more once it works. And never commit so much that one loss ends the game.'
  - ask: life/commit-in-stages/new-snack
  - ask: life/commit-in-stages/final-project
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you commit in stages?'
    situations:
      - 'I am about to put a lot into something new'
      - 'someone offers a better price for a big first order'
      - 'I feel sure enough to go all in'
    action: 'I will start small, see what happens, and add more once it works'
---

Strong chess players attack with enough pieces, not with one piece given up in hope. Off the board, committing in stages becomes a habit only if you practise it there, as this week's task asks. The [Size the risk](/skills/size-risk/) course has more on how much to commit.

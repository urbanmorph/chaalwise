---
title: The fork
summary: Attack two pieces with one move, so only one of them can be saved.
game: chess
stage: 4
order: 1
skills: [calculate]
steps:
  - kind: read
    id: what-a-fork-is
    text: A fork is one piece attacking two at once. Your opponent can save only one of them. A fork is strongest when one of the two is the king, because the check must be answered first. Here the knight can jump to c7 and attack the king and the rook together.
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1
    highlight: [c7]
    arrows: [d5c7]
  - ask: chess/fork/knight-fork
  - ask: chess/fork/pawn-fork
  - ask: chess/fork/queen-fork
  - ask: chess/fork/stop-the-fork
---

A fork makes two threats with one move. Learn to see the squares where it lands, for you and for your opponent.

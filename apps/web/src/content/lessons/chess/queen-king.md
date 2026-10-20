---
title: The queen and the king
summary: The queen is a rook and a bishop in one. The king moves one square, and never into danger.
game: chess
stage: 0
order: 4
skills: []
steps:
  - kind: read
    id: queen-lines
    text: The queen moves like a rook and a bishop together, any distance in a straight line or on a diagonal. Here are all the squares this queen can reach.
    position: 4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1
    highlight:
      [d1, d2, d3, d5, d6, d7, d8, a4, b4, c4, e4, f4, g4, h4, a1, b2, c3, e5, f6, g7, h8, a7, b6, c5, e3, f2, g1]
  - ask: chess/queen-king/queen
  - ask: chess/queen-king/queen-captures
  - kind: read
    id: king-squares
    text: The king moves one square in any direction. It may never move onto a square an enemy piece attacks.
    position: 4k3/8/8/8/3K4/8/8/8 w - - 0 1
    highlight: [c3, c4, c5, d3, d5, e3, e4, e5]
  - ask: chess/queen-king/king
  - ask: chess/queen-king/king-captures
---

The most powerful piece and the most important one. The game is lost when the king is trapped, so learn how each moves.

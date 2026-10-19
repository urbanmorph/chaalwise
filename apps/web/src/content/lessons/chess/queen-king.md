---
title: The queen and the king
summary: The queen is a rook and a bishop in one. The king moves one square, and never into danger.
game: chess
stage: 0
order: 4
skills: []
measures: board
steps:
  - kind: read
    id: queen-lines
    text: The queen moves like a rook and a bishop together, any distance in a straight line or on a diagonal. Here are all the squares this queen can reach.
    position: 4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1
    highlight:
      [d1, d2, d3, d5, d6, d7, d8, a4, b4, c4, e4, f4, g4, h4, a1, b2, c3, e5, f6, g7, h8, a7, b6, c5, e3, f2, g1]
  - kind: choice
    id: queen
    prompt: The queen moves like which two pieces together?
    options:
      - A rook and a bishop
      - A rook and a knight
      - A bishop and a knight
    answer: 0
    explanation: The queen moves any distance in straight lines and on diagonals. That is why she is worth about nine pawns.
  - kind: move
    id: queen-captures
    prompt: Use your queen to take the black rook.
    position: 4k3/8/8/8/8/1r6/8/3QK3 w - - 0 1
    answers: [d1b3]
    hint: Look along the diagonal from d1 up and to the left.
    explanation: The queen takes along the diagonal, just as a bishop would.
  - kind: read
    id: king-squares
    text: The king moves one square in any direction. It may never move onto a square an enemy piece attacks.
    position: 4k3/8/8/8/3K4/8/8/8 w - - 0 1
    highlight: [c3, c4, c5, d3, d5, e3, e4, e5]
  - kind: choice
    id: king
    prompt: How far can the king move?
    options:
      - One square in any direction
      - Any distance, like the queen
      - Two squares at a time
    answer: 0
    explanation: One square in any direction, but never onto a square an enemy piece attacks.
  - kind: move
    id: king-captures
    prompt: Nothing defends the black rook next to your king. Take it with the king.
    position: 4k3/8/8/8/8/8/3r4/4K3 w - - 0 1
    answers: [e1d2]
    hint: The king can capture one square away, like any other move.
    explanation: The king can capture, but only a piece that nothing defends. Otherwise it would be moving into check.
---

The most powerful piece and the most important one. The game is lost when the king is trapped, so learn how each moves.

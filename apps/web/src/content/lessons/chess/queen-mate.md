---
title: Mate with king and queen
summary: Box the lone king in, drive it to the edge, then mate. Without stalemating it.
game: chess
stage: 2
order: 4
skills: [plan-long]
steps:
  - kind: read
    id: plan
    text: "The plan has three parts. Use the queen to box the king in, a knight's move away from it, and shrink the box. Once the king is on the edge, bring your own king up. Then mate. After every queen move, check the king still has a square, or it is stalemate."
  - ask: chess/queen-mate/mate-from-centre
  - ask: chess/queen-mate/mate-again
---

The queen cannot mate alone; the two kings and the queen work together. The computer's king will run for the middle of the board.

---
title: Mate with king and queen
summary: Box the lone king in, drive it to the edge, then mate. Without stalemating it.
game: chess
stage: 2
order: 2
skills: [plan-long]
steps:
  - kind: read
    id: plan
    text: "The plan has three parts. Use the queen to box the king in, a knight's move away from it, and shrink the box. Once the king is on the edge, bring your own king up. Then mate. After every queen move, check the king still has a square, or it is stalemate."
  - kind: play
    id: mate-from-centre
    prompt: Mate the lone king.
    position: 8/8/8/4k3/8/8/8/4KQ2 w - - 0 1
    goal: checkmate
    within: 20
    opponent: lone-king
    hint: Put the queen a knight's move from the king to make a box, then follow it as it shrinks.
    explanation: Box, shrink, bring the king, mate. With practice it takes ten moves or fewer.
  - kind: play
    id: mate-again
    prompt: Again, from here. Make the box first.
    position: 8/8/3k4/8/8/2K5/8/7Q w - - 0 1
    goal: checkmate
    within: 15
    opponent: lone-king
    hint: The queen can cut the king off along a rank or a file straight away.
    explanation: Each time it works, it gets faster. Come back tomorrow and do it again.
---

The queen cannot mate alone; the two kings and the queen work together. The computer's king will run for the middle of the board.

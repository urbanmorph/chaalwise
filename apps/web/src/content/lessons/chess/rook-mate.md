---
title: Mate with king and rook
summary: Cut the king off with the rook, walk your king up, and mate on the edge.
game: chess
stage: 2
order: 6
skills: [plan-long]
steps:
  - kind: read
    id: plan
    text: The rook cuts the king off along a rank or a file. Walk your own king towards it. When the kings stand face to face, check with the rook to push the king back a rank. If the king attacks your rook, move the rook far away along the same line.
  - kind: play
    id: mate-with-rook
    prompt: Mate the lone king.
    position: 8/8/8/4k3/8/8/8/R3K3 w - - 0 1
    goal: checkmate
    within: 30
    opponent: lone-king
    hint: Start with the rook on the fourth rank, cutting the king off from your side of the board.
    explanation: Cut off, walk the king up, check when the kings face each other, repeat. It can take up to sixteen moves, so be patient.
---

Harder than the queen mate, and it teaches the most important endgame idea: the kings fight too.

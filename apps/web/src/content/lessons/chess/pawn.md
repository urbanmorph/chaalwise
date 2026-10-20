---
title: The pawn
summary: Pawns move straight forward but capture diagonally, and never go back.
game: chess
stage: 0
order: 6
skills: []
steps:
  - kind: read
    id: pawn-moves
    text: A pawn moves straight forward one square, or two squares on its first move. It never moves backwards.
    position: 4k3/8/8/8/8/8/4P3/4K3 w - - 0 1
    highlight: [e3, e4]
  - ask: chess/pawn/pawn-push
  - kind: read
    id: pawn-captures
    text: A pawn captures one square diagonally forward. It cannot capture straight ahead.
    position: 4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1
    highlight: [d5, f5]
  - ask: chess/pawn/pawn-capture
  - ask: chess/pawn/pawn-blocked
---

The humblest piece, and the one that shapes the whole game. Learn its moves, which are different from every other piece.

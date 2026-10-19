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
  - kind: move
    id: pawn-push
    prompt: Push the pawn two squares.
    position: 4k3/8/8/8/8/8/4P3/4K3 w - - 0 1
    answers: [e2e4]
    hint: On its first move, a pawn may go two squares.
    explanation: After this first move, the pawn moves one square at a time.
  - kind: read
    id: pawn-captures
    text: A pawn captures one square diagonally forward. It cannot capture straight ahead.
    position: 4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1
    highlight: [d5, f5]
  - kind: move
    id: pawn-capture
    prompt: Take a black pawn.
    position: 4k3/8/8/3p1p2/4P3/8/8/4K3 w - - 0 1
    answers: [e4d5, e4f5]
    hint: Diagonally forward, either side.
    explanation: Either capture works. A pawn that captures moves onto the next file.
  - kind: choice
    id: pawn-blocked
    prompt: A black pawn stands right in front of your pawn. Can your pawn move?
    position: 4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1
    options:
      - No, it is blocked
      - Yes, it takes the black pawn
      - Yes, two squares
    answer: 0
    explanation: A pawn cannot move or capture straight ahead, so two pawns face to face block each other.
---

The humblest piece, and the one that shapes the whole game. Learn its moves, which are different from every other piece.

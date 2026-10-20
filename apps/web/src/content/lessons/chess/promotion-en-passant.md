---
title: Promotion and en passant
summary: The two special pawn moves, becoming a queen and the capture in passing.
game: chess
stage: 0
order: 11
skills: []
measures: board
steps:
  - kind: move
    id: promote
    prompt: A pawn that reaches the last rank must become another piece. Promote your pawn.
    position: 4k3/1P6/8/8/8/8/8/4K3 w - - 0 1
    answers: [b7b8q]
    hint: Push the pawn to b8.
    explanation: Here the new queen even gives check along the back rank.
  - kind: choice
    id: promote-choice
    prompt: Which piece do you almost always choose when you promote?
    options:
      - A queen
      - A knight
      - A piece you have lost earlier
    answer: 0
    feedback:
      - ''
      - 'A knight helps only in rare cases, such as a check that wins. Most of the time a queen does far more.'
      - 'You may choose any piece, even a second queen while your first is still on the board.'
    explanation: A queen is the strongest piece. Very rarely another piece is better, a rook to avoid stalemate, or a knight to give check.
  - kind: move
    id: en-passant
    prompt: Black has just pushed the d-pawn two squares, past your pawn on e5. Take it en passant.
    position: 4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1
    answers: [e5d6]
    hint: Capture as if the black pawn had moved only one square, onto d6.
    explanation: En passant is allowed only on the very next move after the two-square push. Wait, and the chance is gone.
---

Two special pawn rules that come up in real games. Try each one.

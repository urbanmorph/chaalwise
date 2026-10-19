---
title: Castling, promotion and en passant
summary: The three special moves every player must know.
game: chess
stage: 0
order: 4
skills: []
steps:
  - kind: move
    id: castle
    prompt: Castling moves your king two squares towards a rook, and the rook jumps over to the king's other side. Castle on the king's side.
    position: r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1
    answers: [e1g1]
    hint: Move the king two squares to the right, to g1.
    explanation: Castling tucks the king away and brings the rook towards the centre. You cannot castle out of, through or into check, or after the king or that rook has moved.
  - kind: move
    id: promote
    prompt: A pawn that reaches the last rank must become another piece. Promote your pawn.
    position: 4k3/1P6/8/8/8/8/8/4K3 w - - 0 1
    answers: [b7b8q]
    hint: Push the pawn to b8.
    explanation: Nearly always choose a queen. Here the new queen even gives check along the back rank.
  - kind: move
    id: en-passant
    prompt: Black has just pushed the d-pawn two squares, past your pawn on e5. Take it en passant.
    position: 4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1
    answers: [e5d6]
    hint: Capture as if the black pawn had moved only one square, onto d6.
    explanation: En passant is allowed only on the very next move after the two-square push. Wait, and the chance is gone.
---

These moves look strange at first, and they come up in real games. Try each one.

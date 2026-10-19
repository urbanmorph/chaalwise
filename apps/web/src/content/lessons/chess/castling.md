---
title: Castling
summary: Tuck the king away and bring a rook to the centre in one move, when the rules allow it.
game: chess
stage: 0
order: 8
skills: []
steps:
  - kind: move
    id: castle
    prompt: Castling moves your king two squares towards a rook, and the rook jumps over to the king's other side. Castle on the king's side.
    position: r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1
    answers: [e1g1]
    hint: Move the king two squares to the right, to g1.
    explanation: The king is tucked away on g1, and the rook comes to f1, towards the centre.
  - kind: move
    id: castle-long
    prompt: Now castle on the queen's side.
    position: r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1
    answers: [e1c1]
    hint: Move the king two squares to the left, to c1.
    explanation: On the queen's side the king goes to c1 and the rook to d1.
  - kind: choice
    id: castling-rules
    prompt: When can you NOT castle?
    options:
      - When your king is in check, or would pass through or land on an attacked square
      - When your bishop has moved
      - After move ten
    answer: 0
    explanation: You also cannot castle if the king, or that rook, has moved before, or if any piece stands between them.
  - kind: choice
    id: through-check
    prompt: Can White castle on the king's side here?
    position: r3kr2/8/8/8/8/8/8/R3K2R w KQq - 0 1
    options:
      - No, the king would pass through f1, which the black rook attacks
      - Yes, nothing stands between the king and the rook
    answer: 0
    explanation: The king may not pass through an attacked square. The queen's side is still fine.
    highlight: [f1]
---

Castling is the only move where two pieces move at once. Do it early, and your king is safer.

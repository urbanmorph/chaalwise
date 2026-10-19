---
title: Check and getting out of it
summary: When your king is attacked you must get out of check at once. There are three ways.
game: chess
stage: 0
order: 10
skills: [think-ahead]
measures: board
steps:
  - kind: read
    id: three-ways
    text: A king that is attacked is in check, and must get out of check at once. There are three ways. Move the king, block the line, or take the piece giving check.
  - kind: move
    id: escape-check
    prompt: Your king is in check from the rook. Get out of check by taking it.
    position: 4k3/8/8/8/8/8/4r3/4K3 w - - 0 1
    answers: [e1e2]
    hint: Nothing protects the rook, so your king can take it.
    explanation: Capturing the piece that gives check is often the best way out, here winning a rook.
  - kind: move
    id: block-check
    prompt: The rook gives check down the e-file. Block it with your bishop.
    position: k3r3/8/8/8/8/8/3B4/4K3 w - - 0 1
    answers: [d2e3]
    hint: The bishop can step onto the e-file between the rook and your king.
    explanation: A piece between the attacker and the king blocks the check.
  - kind: move
    id: move-king
    prompt: Nothing can block this check or take the rook. Move your king out of check.
    position: 4r2k/8/8/8/8/8/8/4K3 w - - 0 1
    answers: [e1d1, e1d2, e1f1, e1f2]
    hint: Step off the e-file.
    explanation: Any square off the e-file will do here. The king may not step to e2, which the rook still attacks.
---

Check is not the end of the game, but you must answer it straight away.

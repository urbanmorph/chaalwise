---
title: The discovered attack
summary: Move one piece out of the way, and the piece behind it attacks.
game: chess
stage: 4
order: 4
skills: [calculate]
measures: patterns
steps:
  - kind: read
    id: what-a-discovery-is
    text: "A discovered attack happens when one piece moves out of the way and uncovers an attack by the piece behind it. Two threats arrive with one move. Here the bishop on d3 blocks the rook's line to the queen on d8. If the bishop moves with a threat of its own, Black cannot answer both."
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 w - - 0 1
    highlight: [d1, d3, d8]
  - kind: move
    id: bishop-discovery
    prompt: Win the queen.
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 w - - 0 1
    answers: [d3h7]
    hint: Move the bishop with check.
    explanation: Bishop takes on h7 with check. Black must deal with the check, even by taking the bishop, and then the rook takes the queen on d8.
  - kind: move
    id: discovered-check
    prompt: Win the queen with a discovered check.
    position: 4k3/q4ppp/8/4N3/8/8/5PPP/4R1K1 w - - 0 1
    answers: [e5c6]
    hint: Every knight move uncovers check from the rook. Which one also attacks the queen?
    explanation: Knight to c6 uncovers check from the rook on e1 and attacks the queen. Black must answer the check, and the knight takes the queen.
  - kind: choice
    id: see-it-coming
    prompt: Black to move. White threatens Bxh7+, uncovering the rook on your queen. Which move stops it?
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 b - - 0 1
    options:
      - ...Qe7, leaving the d-file
      - ...h6, saving the h-pawn
      - ...Qd5, centralising the queen
    answer: 0
    feedback:
      - ''
      - 'Bh7+ still comes, now without a capture. The king must answer it, and Rxd8 takes the queen.'
      - 'The queen is still on the d-file, behind the bishop. Bxh7+ uncovers the rook, and Rxd5 wins her.'
    explanation: Take the valuable piece off the line before the screening piece moves. When an enemy piece stands between your queen and a rook, the danger is already there.
    highlight: [d1, d8]
---

A discovered attack is two threats with one move: one from the piece that moves, one from the piece behind it. Watch the lines that a single piece is blocking.

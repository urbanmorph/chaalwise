---
title: The discovered attack
summary: Move one piece out of the way, and the piece behind it attacks.
game: chess
stage: 4
order: 4
skills: [calculate]
steps:
  - kind: read
    id: what-a-discovery-is
    text: "A discovered attack happens when one piece moves out of the way and uncovers an attack by the piece behind it. Two threats arrive with one move. Here the bishop on d3 blocks the rook's line to the queen on d8. If the bishop moves with a threat of its own, Black cannot answer both."
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 w - - 0 1
    highlight: [d1, d3, d8]
    arrows: [d3h7, d1d8]
  - ask: chess/discovered-attack/bishop-discovery
  - ask: chess/discovered-attack/discovered-check
  - ask: chess/discovered-attack/see-it-coming
---

A discovered attack is two threats with one move: one from the piece that moves, one from the piece behind it. Watch the lines that a single piece is blocking.

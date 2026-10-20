---
title: The skewer
summary: Attack a valuable piece so that it must move and expose the piece behind it.
game: chess
stage: 4
order: 3
skills: [calculate]
steps:
  - kind: read
    id: what-a-skewer-is
    text: 'A skewer is a pin turned round. The more valuable piece is in front. It is attacked and must move, and the piece behind it falls. Here a rook check on a7 would drive the king off the seventh rank, and then the rook takes on h7.'
    position: 8/2k4r/8/8/8/8/5PPP/R5K1 w - - 0 1
    highlight: [c7, h7]
  - ask: chess/skewer/rook-skewer
  - ask: chess/skewer/bishop-skewer
  - ask: chess/skewer/pin-or-skewer
  - ask: chess/skewer/avoid-the-skewer
---

A skewer hits the bigger piece first, and the smaller one falls behind it. Rooks, bishops and queens skewer along lines.

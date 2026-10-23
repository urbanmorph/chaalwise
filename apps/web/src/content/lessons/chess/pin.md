---
title: The pin
summary: Freeze a piece in front of a more valuable one, then attack it.
game: chess
stage: 4
order: 2
skills: [calculate]
steps:
  - kind: read
    id: what-a-pin-is
    text: A pin is an attack on a piece that cannot move without leaving a more valuable piece behind it open to attack. Here the knight on c6 stands in front of the king. Moving it would leave the king in check, so it may not move at all. Bishops, rooks and queens pin.
    position: 4k3/1p3ppp/2n5/1B6/3P4/8/PP3PPP/6K1 w - - 0 1
    highlight: [b5, c6, e8]
    arrows: [b5e8]
  - ask: chess/pin/pin-the-queen
  - ask: chess/pin/can-it-move
  - ask: chess/pin/attack-the-pinned
  - ask: chess/pin/break-the-pin
  - ask: chess/pin/pinned-cannot-defend
---

A pinned piece cannot move without losing something bigger. Pin your opponent's pieces, attack them, and step your own out of pins in time.

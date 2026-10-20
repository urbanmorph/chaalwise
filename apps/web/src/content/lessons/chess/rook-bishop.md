---
title: Rook and bishop
summary: The two line pieces. The rook goes straight, the bishop goes diagonally, and neither can jump.
game: chess
stage: 0
order: 3
skills: []
steps:
  - kind: read
    id: rook-lines
    text: The rook moves in straight lines, along its rank or its file, as far as the way is clear. Here are all the squares this rook can reach.
    position: 4k3/8/8/8/3R4/8/8/4K3 w - - 0 1
    highlight: [d1, d2, d3, d5, d6, d7, d8, a4, b4, c4, e4, f4, g4, h4]
  - ask: chess/rook-bishop/rook
  - kind: read
    id: bishop-lines
    text: The bishop moves diagonally, as far as the way is clear. Here are all the squares this bishop can reach.
    position: 4k3/8/8/8/3B4/8/8/4K3 w - - 0 1
    highlight: [a1, b2, c3, e5, f6, g7, h8, a7, b6, c5, e3, f2, g1]
  - ask: chess/rook-bishop/bishop
  - ask: chess/rook-bishop/bishop-colour
  - ask: chess/rook-bishop/rook-captures
---

The rook and the bishop each move along lines. Learn their lines and you can see at a glance what they attack.

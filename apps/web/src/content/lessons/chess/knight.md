---
title: The knight
summary: The knight moves in an L and jumps over anything in its way.
game: chess
stage: 0
order: 5
skills: []
steps:
  - kind: read
    id: knight-squares
    text: The knight moves in an L, two squares one way and then one square to the side. It is the only piece that jumps over others. Here are all the squares this knight can reach.
    position: 4k3/8/8/8/3N4/8/8/4K3 w - - 0 1
    highlight: [b3, b5, c2, c6, e2, e6, f3, f5]
  - ask: chess/knight/where-can-it-go
  - ask: chess/knight/knight
  - ask: chess/knight/knight-colour
  - ask: chess/knight/knight-develop
---

The trickiest piece to see, because it jumps. Learn its L and you will spot its attacks before they happen.

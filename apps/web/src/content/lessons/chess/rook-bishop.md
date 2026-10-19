---
title: Rook and bishop
summary: The two line pieces. The rook goes straight, the bishop goes diagonally, and neither can jump.
game: chess
stage: 0
order: 3
skills: []
measures: board
steps:
  - kind: read
    id: rook-lines
    text: The rook moves in straight lines, along its rank or its file, as far as the way is clear. Here are all the squares this rook can reach.
    position: 4k3/8/8/8/3R4/8/8/4K3 w - - 0 1
    highlight: [d1, d2, d3, d5, d6, d7, d8, a4, b4, c4, e4, f4, g4, h4]
  - kind: move
    id: rook
    prompt: Move the rook as far up the board as it can go.
    position: 4k3/8/8/8/8/8/8/R3K3 w - - 0 1
    answers: [a1a8]
    hint: Straight up the a-file.
    explanation: Ra8 also gives check along the back rank. Rooks love open lines.
  - kind: read
    id: bishop-lines
    text: The bishop moves diagonally, as far as the way is clear. Here are all the squares this bishop can reach.
    position: 4k3/8/8/8/3B4/8/8/4K3 w - - 0 1
    highlight: [a1, b2, c3, e5, f6, g7, h8, a7, b6, c5, e3, f2, g1]
  - kind: move
    id: bishop
    prompt: Move the bishop to the far corner.
    position: 4k3/8/8/8/8/8/1B6/4K3 w - - 0 1
    answers: [b2h8]
    hint: Follow the long diagonal up and to the right.
    explanation: A bishop on the long diagonal sees right across the board.
  - kind: choice
    id: bishop-colour
    prompt: A bishop starts on a dark square. Can it ever reach a light square?
    options:
      - No, it stays on dark squares all game
      - Yes, after a few moves
    answer: 0
    explanation: Moving diagonally never changes a square's colour. That is why each side has one light-squared and one dark-squared bishop.
  - kind: move
    id: rook-captures
    prompt: Line pieces capture by moving onto the enemy piece. Take the knight with your rook.
    position: 4k3/8/n7/8/8/8/8/R3K3 w - - 0 1
    answers: [a1a6]
    hint: Straight up the a-file, as far as the knight.
    explanation: The rook takes the knight and stands where it was. Neither the rook nor the bishop can jump over a piece in the way.
---

The rook and the bishop each move along lines. Learn their lines and you can see at a glance what they attack.

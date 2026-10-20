---
title: The knight
summary: The knight moves in an L and jumps over anything in its way.
game: chess
stage: 0
order: 5
skills: []
measures: board
steps:
  - kind: read
    id: knight-squares
    text: The knight moves in an L, two squares one way and then one square to the side. It is the only piece that jumps over others. Here are all the squares this knight can reach.
    position: 4k3/8/8/8/3N4/8/8/4K3 w - - 0 1
    highlight: [b3, b5, c2, c6, e2, e6, f3, f5]
  - kind: square
    id: where-can-it-go
    practice: piece-squares
    prompt: Click any square the knight on d4 can jump to.
    position: 4k3/8/8/8/3N4/8/8/4K3 w - - 0 1
    coordinates: true
    answers: [b3, b5, c2, c6, e2, e6, f3, f5]
    hint: Two squares straight, then one to the side.
    explanation: A knight in the centre reaches eight squares. On the edge it reaches fewer, and in a corner only two.
  - kind: move
    id: knight
    prompt: Jump a knight over your pawns to f3.
    position: start
    answers: [g1f3]
    hint: The knight on g1 can reach f3.
    explanation: Knights are the only pieces that can move before any pawn has.
  - kind: choice
    id: knight-colour
    prompt: A knight stands on a light square and makes one move. What colour does it land on?
    options:
      - Always dark
      - Always light
      - It depends on the move
    answer: 0
    feedback:
      - ''
      - 'A knight never lands on its own colour. Two squares one way and one to the side always changes colour.'
      - 'It looks as if it should, but every L ends on the other colour, whichever way the knight goes.'
    explanation: Every knight move changes the colour of its square. That is a handy check when you picture where it can go.
  - kind: move
    id: knight-develop
    prompt: Now bring out the other knight towards the centre.
    position: 'moves: Nf3 e5'
    answers: [b1c3]
    hint: The knight on b1 has a square towards the centre.
    explanation: Knights do most from the centre, where they reach the most squares.
---

The trickiest piece to see, because it jumps. Learn its L and you will spot its attacks before they happen.

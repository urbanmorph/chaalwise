---
title: Set up the board
summary: Two memory tricks so the board is never the wrong way round, and your first move.
game: chess
stage: 0
order: 2
skills: []
measures: board
steps:
  - kind: choice
    id: light-on-right
    prompt: You sit behind the white pieces. Which square is in the corner on your right, and what colour is it?
    position: start
    options:
      - h1, a light square
      - h1, a dark square
      - a1, a dark square
    answer: 0
    feedback:
      - ''
      - 'Right corner, wrong colour. The square on your right is always light; if it is dark, the board is turned.'
      - 'a1 is a dark square, but it is on your left. Files run from a on your left to h on your right.'
    hint: Look at the board. Your right-hand corner is the h-file and the first rank.
    explanation: 'Light on right: the corner square on your right is always light. If it is dark, the board is turned the wrong way.'
    highlight: [h1]
  - kind: choice
    id: queen-on-colour
    prompt: Where does the white queen start?
    position: start
    options:
      - d1
      - e1
    answer: 0
    feedback:
      - ''
      - 'e1 is where the king starts. The white queen stands on her own colour, the light square d1.'
    hint: The white queen stands on a light square.
    explanation: 'Queen on her colour: the white queen starts on the light square d1, and the black queen on the dark square d8. Each king stands next to its queen.'
    highlight: [d1, d8]
  - kind: move
    id: first-move
    prompt: Move the pawn in front of your king forward two squares.
    position: start
    answers: [e2e4]
    hint: Your king is on e1, so its pawn is on e2.
    explanation: Moving this pawn to e4 takes space in the centre and opens lines for your queen and the bishop on f1.
---

Every game starts from the same position. Two short tricks make sure you always set it up right.

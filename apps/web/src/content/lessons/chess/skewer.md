---
title: The skewer
summary: Attack a valuable piece so that it must move and expose the piece behind it.
game: chess
stage: 4
order: 3
skills: [calculate]
measures: patterns
steps:
  - kind: read
    id: what-a-skewer-is
    text: 'A skewer is a pin turned round. The more valuable piece is in front. It is attacked and must move, and the piece behind it falls. Here a rook check on a7 would drive the king off the seventh rank, and then the rook takes on h7.'
    position: 8/2k4r/8/8/8/8/5PPP/R5K1 w - - 0 1
    highlight: [c7, h7]
  - kind: move
    id: rook-skewer
    prompt: Skewer the king and the rook.
    position: 8/2k4r/8/8/8/8/5PPP/R5K1 w - - 0 1
    answers: [a1a7]
    hint: Check along the seventh rank.
    explanation: Rook to a7 checks the king. Wherever it goes, it leaves the seventh rank, and your rook takes on h7.
  - kind: move
    id: bishop-skewer
    prompt: Skewer the king and the queen.
    position: q7/7p/8/3k4/8/8/4B1PP/6K1 w - - 0 1
    answers: [e2f3]
    hint: The king and the queen share a long diagonal.
    explanation: Bishop to f3 checks the king along the long diagonal. The king must step off it, and the bishop takes the queen on a8.
  - kind: choice
    id: pin-or-skewer
    prompt: 'After Bf3+ here, is it a pin, a skewer or a fork?'
    position: q7/7p/8/3k4/8/5B2/6PP/6K1 b - - 0 1
    options:
      - A skewer, as the king is in front
      - A pin, as the queen is stuck
      - A fork, as two pieces are hit
    answer: 0
    feedback:
      - ''
      - 'In a pin the cheaper piece is in front. Here the king is in front, and it is the king that must move.'
      - 'A fork attacks in two directions. Here both pieces are on one line, so the front one moves and the back one falls.'
    explanation: The king is in front and must move out of check, which exposes the queen behind it. That is a skewer.
    highlight: [d5, a8]
  - kind: choice
    id: avoid-the-skewer
    prompt: Black to move. Which king move is safe from a skewer?
    position: 8/7p/3k4/7q/8/8/5PPP/R5K1 b - - 0 1
    options:
      - ...Ke6
      - ...Kd5
      - ...Ke5
    answer: 0
    feedback:
      - ''
      - 'This puts the king on the fifth rank with the queen. Ra5+ drives the king away, and the rook takes on h5.'
      - 'Moving towards the queen does not help. The king is still on the fifth rank, so Ra5+ and then Rxh5 wins the queen.'
    explanation: Keep your king and queen off the same line when an enemy rook, bishop or queen can check along it. On e6 the king is off the fifth rank, so there is no skewer.
    highlight: [a5]
---

A skewer hits the bigger piece first, and the smaller one falls behind it. Rooks, bishops and queens skewer along lines.

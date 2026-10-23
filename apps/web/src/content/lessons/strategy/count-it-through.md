---
title: Count it through
summary: Follow a chain of consequences to the end before you agree to the first step.
game: strategy
stage: 1
order: 1
skills: [calculate]
after: chess/safe-moves
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, before you capture, follow every capture on that square to the end, and ask who is ahead when the captures stop. Here White's pawn takes the knight on d5 (exd5), and Black's pawn takes back (exd5). White has won a knight for a pawn, so White is ahead.
    position: 4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1
    highlight: [d5]
    arrows: [e4d5, e6d5]
  - kind: read
    id: off-the-board
    text: Off the board, many offers look good at the first step, such as a free first month. Count every step that follows, to the end, before you agree.
  - ask: life/count-it-through/gym
  - ask: life/count-it-through/bulk-offer
  - ask: chess/count-it-through/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you count a chain through?'
    situations:
      - 'an offer looks good at first sight'
      - 'I am asked to take on a new commitment'
      - 'I am about to sign up for something with a free start'
    action: 'I will write down every step that follows, and its cost, before I say yes'
---

Calculation in chess is counting a sequence to the end. Off the board, the counting becomes a habit only if you practise it there too, as this week's task asks.

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
    text: On the board, before a capture, you follow every capture on that square to the end. Who is ahead when the captures stop? Here exd5 exd5 leaves White a knight for a pawn up.
    position: 4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1
    highlight: [d5]
  - kind: read
    id: off-the-board
    text: Off the board, many offers look good at the first step. Count the whole chain, to where it stops, before you agree.
  - kind: choice
    id: gym
    prompt: A gym offers a free first month, then a contract for a year. How do you count it through?
    options:
      - Add up the whole year, and what it costs to leave early
      - The first month is free, so it is a good deal
      - Count how many machines it has
    answer: 0
    explanation: The free month is the first capture. The contract is the recapture. Judge where the sequence ends.
  - kind: choice
    id: bulk-offer
    prompt: Buy two, get one free, on something you only need one of. Is it a good deal?
    options:
      - Only if you would really use all three
      - Yes, free is always good
    answer: 0
    explanation: You pay for two to get three. Counted through, it costs you twice what you needed to spend.
  - kind: read
    id: try-it
    text: Try it this week. When an offer looks good, write down every step that follows, and its cost, before you say yes.
---

Calculation in chess is counting a sequence to the end. The same counting saves money and trouble off the board.

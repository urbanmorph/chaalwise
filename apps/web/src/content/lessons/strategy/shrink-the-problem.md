---
title: Shrink the problem
summary: Each step should leave fewer ways for things to go wrong, and the last step needs as much care as the first.
game: strategy
stage: 2
order: 1
skills: [plan-long]
after: chess/queen-mate
steps:
  - kind: read
    id: on-the-board
    text: On the board, you do not mate a lone king in one go. Each queen move shrinks its box until it has nowhere left. Rush the last step and you give stalemate instead.
    position: 8/8/8/2k5/8/3Q4/8/4K3 w - - 0 1
    highlight: [a4, b4, c4, a5, b5, c5, a6, b6, c6, a7, b7, c7, a8, b8, c8]
  - kind: read
    id: off-the-board
    text: Off the board, a big goal is a series of small steps, each leaving fewer ways for it to go wrong. And the finish needs care, because that is where hurry spoils the work.
  - kind: choice
    id: saving
    prompt: You are saving for a deposit on a home. Which plan shrinks the problem?
    options:
      - Set aside a fixed amount every month, and cut one cost each month
      - Wait for a windfall
      - Save whatever is left at the end of the month
    answer: 0
    explanation: Each month the gap gets smaller and the plan gets harder to knock off course, like the shrinking box.
  - kind: choice
    id: room
    prompt: You are clearing a very messy room. What is the box?
    options:
      - Finish one corner and keep it clear while you do the next
      - Move everything around a little at once
    answer: 0
    explanation: A finished corner is like a square the king can no longer use. The problem only shrinks if each gain is kept.
  - kind: read
    id: try-it
    text: Try it this week. Take one big job, mark a small corner of it you can finish today, and keep that corner done.
---

The basic mates teach patience. The idea works for any large task.

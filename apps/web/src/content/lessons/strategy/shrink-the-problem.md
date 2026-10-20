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
    prompt: You want 300,000 for a deposit in two years, and you can afford to save 12,500 a month. Which plan is most likely to get you there?
    options:
      - Move 12,500 to a separate account each payday
      - Save whatever is left at the end of each month
      - Save more later, once your pay goes up
    answer: 0
    feedback:
      - ''
      - It feels flexible, but what is left at the end of the month is usually less than planned, and nothing is locked in.
      - A pay rise may come, but waiting leaves the whole gap open for longer, and spending tends to rise with pay.
    explanation: 24 × 12,500 = 300,000. Moving it on payday keeps each month's gain out of reach, so the gap gets smaller and the plan gets harder to knock off course, like the shrinking box.
  - kind: choice
    id: room
    prompt: You have one weekend to clear a garage packed to the roof, and you will not finish it. By Sunday night, which is the better state to leave it in?
    options:
      - Half of it fully cleared, the rest untouched
      - All of it a little tidier than before
      - Everything sorted into piles on the floor
    answer: 0
    feedback:
      - ''
      - Tidying everywhere looks like progress, but nothing is finished, and the mess spreads back over the week.
      - Sorting feels like a step forward, but piles on the floor make the whole garage harder to use until every pile is dealt with.
    explanation: A finished half is like a square the king can no longer use. The problem only shrinks if each gain is kept.
  - kind: read
    id: try-it
    text: Try it this week. Take one big job, mark a small corner of it you can finish today, and keep that corner done.
---

The basic mates show the idea on a small board. Off the board, try it on one large task, as this week's task asks.

---
title: Two birds, one stone
summary: Look for the one move that serves two aims, so the other side cannot answer both.
game: strategy
stage: 4
order: 1
skills: [think-ahead]
after: chess/fork
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, a fork attacks two things with one move, and only one of them can be saved. Here Nc7+ checks the king and attacks the rook on a8. Black must answer the check, and the rook falls.
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1
    highlight: [c7, e8, a8]
    arrows: [d5c7]
  - ask: chess/two-birds-one-stone/one-move-two-jobs
  - kind: read
    id: off-the-board
    text: Off the board, look for the one action that serves two aims at once. Against someone, it gives them two problems and time to answer one. In your own plans, it gets two results from the same effort.
  - ask: life/two-birds-one-stone/new-hire
  - ask: life/two-birds-one-stone/commute
  - ask: chess/two-birds-one-stone/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you look for one move with two aims?'
    situations:
      - 'two jobs compete for the same hours'
      - 'I plan a change at work, in my studies or at home'
      - 'I make a move that someone else must answer'
    action: 'I will look for one action that serves both aims before I do them one by one'
---

A fork is the clearest case of one move doing two jobs. Off the board, looking for that move becomes a habit only if you practise it there too, as this week's task asks.

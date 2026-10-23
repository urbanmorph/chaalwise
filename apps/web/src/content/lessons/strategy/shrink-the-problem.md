---
title: Small steps that stick
summary: Each step should leave fewer ways for things to go wrong, and the last step needs as much care as the first.
game: strategy
stage: 2
order: 1
skills: [plan-long]
after: chess/queen-mate
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, you do not checkmate a lone king in one move. Each queen move shrinks the box the king can move in, until it has nowhere left. Rush the last step and you may give stalemate instead, where the king is not attacked but cannot move, and the game is a draw.
    position: 8/8/8/2k5/8/3Q4/8/4K3 w - - 0 1
    highlight: [a4, b4, c4, a5, b5, c5, a6, b6, c6, a7, b7, c7, a8, b8, c8]
  - kind: read
    id: off-the-board
    text: Off the board, a big goal is a series of small steps, each leaving fewer ways for it to go wrong. And the finish needs care, because that is where hurry spoils the work.
  - ask: life/shrink-the-problem/saving
  - ask: life/shrink-the-problem/room
  - ask: chess/shrink-the-problem/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you shrink a big job?'
    situations:
      - 'a big job feels too large to start'
      - 'I plan my day or my week'
      - 'an assignment or project is due in more than a week'
    action: 'I will mark one small part I can finish today, and finish it'
---

The basic mates show the idea on a small board. Off the board, try it on one large task, as this week's task asks.

---
title: Not so fast
summary: Before you push on with your plan, ask what the other side wants, and stop it before it starts.
game: strategy
stage: 4
order: 1
skills: [think-ahead]
after: chess/discovered-attack
steps:
  - kind: read
    id: on-the-board
    text: On the board, Black sees what White wants. Bxh7+ would uncover the rook on the queen. Black does not wait for it. ...Qe7 takes the queen off the line first, and the threat is gone before it starts.
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 b - - 0 1
    highlight: [d1, d3, d8]
    arrows: [d3h7, d1d8, d8e7]
  - ask: chess/not-so-fast/stop-the-fork
  - kind: read
    id: off-the-board
    text: Off the board, before you push on with your own plan, ask what the other side most wants to do next. If it would hurt, spend a quiet step stopping it now. Preventing a problem is usually cheaper than fighting it once it has started.
  - ask: life/not-so-fast/best-engineer
  - ask: life/not-so-fast/lab-sessions
  - ask: chess/not-so-fast/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you stop a problem before it starts?'
    situations:
      - 'I am about to push on with my own plan'
      - 'I can see a deadline, booking or price that will bite'
      - 'someone on the other side has an obvious next step'
    action: 'I will ask what they most want to do next, and take one quiet step to stop it'
---

Chess players call it prophylaxis. Off the board, asking what the other side wants becomes a habit only if you practise it there too, as this week's task asks.

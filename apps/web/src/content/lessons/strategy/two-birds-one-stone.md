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
    text: On the board, a fork attacks two things with one move, and only one of them can be saved. Here Nc7+ checks the king and attacks the rook on a8. Black must answer the check, and the rook falls.
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1
    highlight: [c7, e8, a8]
  - kind: move
    id: one-move-two-jobs
    prompt: Find the move that does two jobs at once, and win material.
    position: 3q3k/pp4pp/8/4N3/8/8/PP3PPP/2R3K1 w - - 0 1
    measures: patterns
    answers: [e5f7]
    hint: Which square lets your knight check the king on h8 and attack something else?
    explanation: Nf7+ checks the king and attacks the queen on d8. The king must move, and Nxd8 wins the queen for nothing.
  - kind: read
    id: off-the-board
    text: Off the board, look for the one action that serves two aims at once. Against someone, it gives them two problems and time to answer one. In your own plans, it gets two results from the same effort.
  - kind: choice
    id: new-hire
    prompt: This week you must train a new hire and clear 40 overdue customer queries. Training takes about 10 hours, the queries about 12, and you have 15 free hours. What do you do?
    options:
      - Train first, then clear what queries you can
      - Clear the queries first, and train next week
      - Train the hire by clearing the queries together
    answer: 2
    feedback:
      - Training first uses 10 of your 15 hours and leaves 5 for 12 hours of queries. Most of them wait another week.
      - The queries get done, but the new hire sits idle for a week, and more queries arrive meanwhile.
      - ''
    explanation: Done one after the other, the two jobs need 22 hours and you have 15. Done together, the queries become the training material, and the same hours serve both aims.
  - kind: choice
    id: commute
    prompt: You want to get fitter, and the bus to college costs you 60 a day, about 1,200 a month. College is 5 km away on a safe road. Which plan serves you best?
    options:
      - Join a gym for 1,500 a month and keep taking the bus
      - Cycle to college most days
      - Walk at weekends, and keep the bus for college
    answer: 1
    feedback:
      - The gym helps your fitness, but your costs rise to 2,700 a month, and the bus fares stay.
      - ''
      - Weekend walks help a little, but the weekday fares stay as they were.
    explanation: Cycling serves both aims with one change. It saves about 1,200 a month on fares, and builds exercise into every college day.
  - kind: choice
    id: compare
    prompt: "What do the knight's move and the shop's move share?"
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1
    alongside: 'A shop moves its counter to the station, where the rent is lower and more people pass.'
    options:
      - 'One move that serves two aims at once'
      - 'Both are about moving to a better spot'
      - 'Both spread their effort over as many aims as possible'
    answer: 0
    feedback:
      - ''
      - 'Moving is the surface likeness. The point is that one move pays twice: check and rook, lower rent and more buyers.'
      - 'Spreading effort is the opposite. One move serves two aims; it does not add more moves.'
    explanation: 'Nc7+ checks the king and attacks the rook. The shop cuts its rent and finds more buyers. In both, one action pays twice.'
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

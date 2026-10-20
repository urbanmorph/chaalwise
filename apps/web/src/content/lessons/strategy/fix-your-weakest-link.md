---
title: Fix your weakest link
summary: When nothing is urgent and the parts depend on each other, improve the part doing least.
game: strategy
stage: 5
order: 1
skills: [plan-long]
after: chess/middlegame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, nothing is urgent here. White's bishop on c1 is shut in by its own pawns and touches nothing. The best plan is to give it a road, starting with b3, so it can come out to b2 or a3.
    position: 5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1
    highlight: [c1]
  - ask: chess/fix-your-weakest-link/worst-piece
  - kind: read
    id: off-the-board
    text: Off the board, when nothing is urgent, spend the time on the part doing least. This works when the parts depend on each other, like the steps of a process or subjects you must all pass. The weakest one sets the limit. Where one great result is enough, invest in your strongest instead.
  - ask: life/fix-your-weakest-link/three-steps
  - ask: life/fix-your-weakest-link/three-subjects
  - ask: chess/fix-your-weakest-link/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you fix your weakest link?'
    situations:
      - 'nothing is urgent at work and I have an hour'
      - 'I plan my study or practice for the week'
      - 'a process at work or at home keeps running late'
    action: 'I will find the part doing least, check the rest depends on it, and improve it first'
---

Middlegame plans often start with the worst piece. Off the board, finding the weakest link becomes a habit only if you practise it there too, as this week's task asks.

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
  - kind: move
    id: worst-piece
    prompt: Nothing is urgent. Find the piece doing least, and put it to work on the open file.
    position: r4rk1/pp1n1ppp/2p5/2b1p3/2B1P3/2P2N2/PP3PPP/R4RK1 w - - 0 1
    measures: planning
    answers: [a1d1, f1d1]
    hint: One file has no pawns on it. Which of your pieces has not moved, and can reach it?
    explanation: The rook on a1 has not moved and touches nothing. Rad1 puts it on the open d-file, where it presses into Black's position. Rfd1 brings the other idle rook instead, which works as well.
  - kind: read
    id: off-the-board
    text: Off the board, when nothing is urgent, spend the time on the part doing least. This works when the parts depend on each other, like the steps of a process or subjects you must all pass. The weakest one sets the limit. Where one great result is enough, invest in your strongest instead.
  - kind: choice
    id: three-steps
    prompt: Each report your team sends passes through three people in turn. One drafts it in 1 day, one checks it in 4 days, and one sends it in 1 day. You can halve the time of one step. Which gets more reports out each month?
    options:
      - Drafting, since every report starts there
      - Checking, the 4-day step
      - Sending, since it is the step the client sees
    answer: 1
    feedback:
      - Faster drafting gets reports to the checker sooner, but they only pile up there. The checker still clears one every 4 days.
      - ''
      - Faster sending pleases the client, but the checker still releases only one report every 4 days.
    explanation: The checker finishes one report every 4 days, so the team sends about 7 a month. Halve checking and it sends about 15. Halving either other step changes nothing.
  - kind: choice
    id: three-subjects
    prompt: To get into your course, you need 60 or more in each of three subjects. Your mock marks are maths 78, physics 74 and chemistry 41. You have 10 hours of revision left this week. How do you use them?
    options:
      - Split them evenly, about 3 hours each
      - Put most of them into chemistry
      - Push maths higher, since it is your best
    answer: 1
    feedback:
      - Even hours feel fair, but maths and physics are already over 60. Only chemistry is below the line.
      - ''
      - Building on your best pays when one great result is enough. Here each subject must reach 60, and maths already does.
    explanation: You need all three at 60. Chemistry, at 41, is the only one below, so it sets the limit. Hours there change the outcome; hours elsewhere do not.
  - kind: choice
    id: compare
    prompt: "What do White's bishop and the restaurant's till share?"
    position: 5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1
    alongside: 'A restaurant serves excellent food, but every order waits 40 minutes at one slow till.'
    options:
      - 'The part doing least sets the limit; fix it first'
      - 'Both are stuck at the back, out of sight'
      - 'Both say build on what is already strongest'
    answer: 0
    feedback:
      - ''
      - 'Being at the back is a surface likeness. What matters is that the rest cannot do more until this part does.'
      - 'Building on strength pays when one great result is enough. A good meal needs both the food and the till, so the weakest part counts.'
    explanation: 'The shut-in bishop holds White back, and the slow till holds back excellent food. When the parts depend on each other, the weakest one decides.'
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

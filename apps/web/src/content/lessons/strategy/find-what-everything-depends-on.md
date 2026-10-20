---
title: Find what everything depends on
summary: Find the one part that holds everything else up. Strike it if it is theirs; back it up if it is yours.
game: strategy
stage: 4
order: 1
skills: [calculate]
after: chess/pin
steps:
  - kind: read
    id: on-the-board
    text: On the board, Black's bishop on d4 is guarded only by the knight on c6, and the knight is pinned to its king. The whole defence rests on one piece, and that piece cannot move. Rxd4 wins the bishop, because the knight cannot take back.
    position: 4k3/pp3ppp/2n5/1B6/3b4/8/PP3PPP/3R2K1 w - - 0 1
    highlight: [c6, d4]
  - kind: move
    id: remove-the-guard
    prompt: Your queen and bishop both aim at h7. Find what Black's defence rests on, and remove it.
    position: 3q1rk1/pp3ppp/5n2/3p2B1/3P4/3Q4/PP3PPP/1B4K1 w - - 0 1
    measures: calculation
    answers: [g5f6]
    hint: What stops Qxh7 mate today?
    explanation: The knight on f6 is the only guard of h7. Bxf6 removes it, and if Black takes back, Qxh7 is mate. Black must block with ...g6, and then the bishop takes the queen on d8 as well.
  - kind: read
    id: off-the-board
    text: Off the board, plans, teams and deals often rest on one part. A single supplier, one person who knows the system, one assumption. Find it before you act. If it is theirs, that is where to press. If it is yours, back it up before someone else finds it.
  - kind: choice
    id: one-mill
    prompt: Your bakery sells 200 cakes a day. All its flour comes from one mill, which closed for a week last year. You have 50,000 to make the business safer. What do you spend it on?
    options:
      - A second mill, and a week of flour in store
      - A new oven, since the old one is the slowest
      - Advertising, to grow sales past 200 a day
    answer: 0
    feedback:
      - ''
      - A slow oven limits how many cakes you bake. A closed mill stops every cake at once.
      - More sales make the single mill matter more, not less. A week without flour stops all of them.
    explanation: Every cake rests on the one mill. Backing it up protects all 200 a day. The other spends improve one part while everything still hangs on the flour.
  - kind: choice
    id: group-report
    prompt: Your group of four has six weeks for a report. Every chapter uses the results of a survey that one member is running, due in week two. It is week one. What do you check first?
    options:
      - That each chapter has a clear outline
      - That the survey is on track, and who could step in
      - That the work is split fairly between the four
    answer: 1
    feedback:
      - Outlines help, but every chapter will need rewriting if the survey is late or wrong.
      - ''
      - A fair split matters to the group, but all four shares stand on the survey.
    explanation: All four chapters rest on one survey and one person. Check it, and have someone ready to step in, before anything else.
  - kind: choice
    id: compare
    prompt: 'What does the pinned knight share with the sales manager?'
    position: 4k3/pp3ppp/2n5/1B6/3b4/8/PP3PPP/3R2K1 w - - 0 1
    alongside: "All of a firm's sales depend on one manager, who holds every client contact."
    options:
      - 'Much rests on one piece, so find it first'
      - 'Both are about the leader at the top'
      - 'The most valuable piece is always the key one'
    answer: 0
    feedback:
      - ''
      - 'The king and the manager are both at the top, but that is a surface likeness. What matters is the one piece the rest depends on.'
      - 'The key piece is the one the rest stands on. Here it is a knight, worth far less than the king behind it.'
    explanation: "The bishop's safety rests on the pinned knight, and the firm's sales rest on one manager. Find that piece. In chess you strike it; in your own firm, you back it up."
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you look for what everything depends on?'
    situations:
      - 'I plan a project with several parts'
      - 'I get ready for an exam, a trip or an event'
      - "I size up a rival's plan or offer"
    action: 'I will name the one thing it all rests on, and back it up or plan around it'
---

Pins and guards teach you to see what holds a position together. Off the board, looking for it becomes a habit only if you practise it there too, as this week's task asks.

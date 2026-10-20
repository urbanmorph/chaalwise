---
title: Give a little, get more
summary: Give up one thing only for more of another, and count both in the same units.
game: strategy
stage: 5
order: 3
skills: [size-risk]
after: chess/middlegame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, White offers the f-pawn in the King's Gambit. If Black takes, White aims to build a centre with d4 and use the half-open f-file. A pawn is given for time and space, and the trade is good only if White can use them.
    position: 'moves: e4 e5 f4 exf4'
    highlight: [e4, f4]
  - kind: move
    id: give-to-get
    prompt: Give a little to get more. Find the move that wins material.
    position: 6k1/pp3ppp/4q3/3N4/8/8/PP3PPP/2R3K1 w - - 0 1
    measures: calculation
    answers: [c1c8]
    hint: Where would Black's queen have to stand for your knight to fork it with the king?
    explanation: Rc8+ gives the rook. If ...Qxc8, Ne7+ forks the king and the queen, and Nxc8 wins the queen, a rook (5) for a queen (9). If ...Qe8 blocks instead, Rxe8 is mate.
  - kind: read
    id: off-the-board
    text: Off the board, most real choices are trades, not free wins. Money, time and position can be swapped for one another. Give one up only for more of another, and count both in the same units. What you give up is the cost, even when no money changes hands.
  - kind: choice
    id: data-entry
    prompt: Your team spends 10 hours a week on manual data entry. A tool costing 60,000 a year would cut that to 2 hours. An hour of the team's time costs the firm 500. What do you do?
    options:
      - Buy it, as the hours saved are worth about 200,000 a year
      - Skip it, since the team's time is already paid for
      - Buy it only if it pays for itself within a month
    answer: 0
    feedback:
      - ''
      - Salaries are paid either way, but the freed hours could go to other work. That lost work is the real cost.
      - It pays for itself in about 15 weeks, and keeps paying after. A one-month bar turns down a trade that returns three times its cost.
    explanation: 8 hours a week at 500, over about 50 working weeks, is 200,000 a year of time for 60,000 of money. Give the little to get the more.
  - kind: choice
    id: study-swap
    prompt: A friend offers a swap. You spend 3 hours helping with her coding assignment, and she teaches you the statistics you are stuck on, which would take you about 8 hours alone. Your own deadline is in a week. What do you do?
    options:
      - Accept, as you give 3 hours and save about 5
      - Decline, as you cannot spare 3 hours this week
      - Decline, and learn the statistics alone to be sure
    answer: 0
    feedback:
      - ''
      - The 3 hours feel like a loss, but learning alone costs 8. Declining spends more of your week, not less.
      - Learning alone may feel safer, but it costs 8 hours instead of 3, five hours you could spend on the rest of your work.
    explanation: Give 3 hours, get back 8. Counted in the same units, the trade leaves you 5 hours ahead before your deadline.
  - kind: choice
    id: compare
    prompt: "What does White's f-pawn share with the start-up's shares?"
    position: 'moves: e4 e5 f4 exf4'
    alongside: 'A start-up gives up 10% of its shares for the money to hire three engineers.'
    options:
      - 'Something is given up to get more of something else'
      - 'Both are about losing part of what you own'
      - 'Any sacrifice is good if it is bold enough'
    answer: 0
    feedback:
      - ''
      - 'Losing something is the surface. The point is the exchange: a pawn for time and space, shares for engineers.'
      - 'Boldness is not the test. The trade is good only if what comes back is worth more than what was given.'
    explanation: 'White gives a pawn for time and the centre; the start-up gives shares for people. Each is right only if what it gets is worth more, and it can show how.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you weigh a trade?'
    situations:
      - 'someone asks me to give up time or money'
      - 'I am about to refuse a small cost out of habit'
      - 'I choose between two uses of my week'
    action: 'I will write what I give and what I get, in the same units, before I decide'
---

Gambits and sacrifices trade material for time or an attack. Off the board, counting both sides of a trade becomes a habit only if you practise it there too, as this week's task asks.

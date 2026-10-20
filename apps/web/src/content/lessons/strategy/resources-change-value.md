---
title: Resources change value
summary: What a thing is worth depends on the situation. When the situation changes, value what you hold again.
game: strategy
stage: 6
order: 1
skills: [plan-long]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, a pawn counts as one point and a knight as three. In the endgame that changes. If White had a knight here instead of the pawn, it could never win, because king and knight alone cannot mate. The b-pawn could become a queen. And the kings, which hid all game, are now fighters.
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    highlight: [b4, e6, f2]
  - kind: move
    id: worth-a-queen
    prompt: With nothing else left, this pawn is worth a queen if it gets through. Only one move wins. Find it.
    position: 8/8/6k1/8/1P6/8/8/6K1 w - - 0 1
    measures: endgame
    answers: [b4b5]
    hint: Can Black's king catch the pawn? Use the square of the pawn.
    explanation: b5 leaves Black's king outside the square of the pawn. It is too far away to catch it, and the pawn queens. Any king move gives Black time to step into the square, and the game is drawn.
  - kind: read
    id: off-the-board
    text: Off the board, nothing has a fixed value. A skill, a product or a contact can be worth a lot in one situation and little in the next. When the situation changes, value what you hold again, instead of going by what it used to be worth.
  - kind: choice
    id: next-hire
    prompt: A small firm has five sales staff and one web developer. Two years ago, one order in five came through the website. Now four in five do. There is money for one new hire. Who should it be?
    options:
      - A second developer, for the website
      - A sixth salesperson, as sales staff bring in orders
      - Half of each, a part-time developer and seller
    answer: 0
    feedback:
      - ''
      - That was true two years ago. Now the five salespeople bring in one order in five between them, and one person runs the channel that brings in the rest.
      - Splitting feels safe, but it gives the channel that brings in four orders in five only half the help it needs.
    explanation: The website used to bring one order in five; now it brings four. The value of each role moved with the business, so the next hire should follow it, as a pawn's value grows when the pieces come off.
  - kind: choice
    id: new-exams
    prompt: At school you earned top marks by learning facts quickly. At university, the exams let you bring your notes and ask you to argue a case. You have one extra hour a day to study. How do you use it?
    options:
      - Write practice answers that argue a case
      - Learn more facts, since memory is your strength
      - Copy out neater, fuller notes to take in
    answer: 0
    feedback:
      - ''
      - Memory was worth a great deal when exams tested facts. With notes allowed, it is worth much less, so more of it adds little.
      - Good notes help, but with notes allowed, everyone has the facts. Marks now go to the argument, which notes cannot write for you.
    explanation: The same strength changed value when the exam changed. Spend the hour on what the new situation rewards, not on what used to earn marks.
  - kind: choice
    id: compare
    prompt: The b-pawn, worth one point earlier in the game, is worth a queen here. What does that share with the shop?
    position: 8/8/6k1/8/1P6/8/8/6K1 w - - 0 1
    alongside: A family firm's shop on the high street was its best asset, until most of its sales moved online.
    options:
      - What a thing is worth depends on the situation
      - Both are about something small growing large
      - Both show that old strengths always lose value
    answer: 0
    feedback:
      - ''
      - The pawn grew in value, but the shop shrank. What they share is that the value moved with the situation, in either direction.
      - Not always. The pawn was a small thing that became decisive. Value can rise as well as fall; the point is to look again.
    explanation: Neither the pawn nor the shop has a fixed worth. When the pieces came off, the pawn's worth rose; when buyers moved online, the shop's worth fell. In both, value what you hold now.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you value what you hold again?'
    situations:
      - 'my team, my role or my market changes'
      - 'I fall back on an old strength out of habit'
      - 'I choose what to study or practise next'
    action: 'I will ask what each thing is worth now, not what it used to be worth'
---

Endgames show how quickly values change when the board empties. Off the board, valuing things again becomes a habit only if you practise it there, as this week's task asks.

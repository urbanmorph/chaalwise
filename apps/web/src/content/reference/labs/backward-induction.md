---
term: 'Backward induction'
game: 'labs'
kind: 'concept'
skill: 'calculate'
level: 'beginner'
aliases: ['Working backwards', 'Reasoning backwards']
summary: 'Solve the last decision first, then the one before it, until you reach the move you have to make now.'
related: ['strategy/count-it-through', 'labs/nash-equilibrium', 'labs/prisoners-dilemma']
try:
  - kind: choice
    id: nim-eleven
    prompt: 'In Nim, each player takes 1, 2 or 3 counters, and whoever takes the last one wins. The pile has 11 and it is your move. How many do you take?'
    options: ['3, to leave 8', '1, to leave 10', '2, to leave 9']
    answer: 0
    feedback:
      - ''
      - 'From 10, the other player takes 2 and leaves you 8. Every multiple of 4 is a loss for the player to move, so you want to leave one, not face one.'
      - 'From 9, the other player takes 1 and leaves you 8, a multiple of 4. Whatever you take from 8, they can leave you 4, then 0.'
    explanation: 'Work back from 0: the player who leaves 0 wins, so leaving 4 wins, and so does leaving 8. Taking 3 from 11 leaves 8.'
  - kind: choice
    id: deadline
    prompt: 'A report must reach the board on Friday morning. Printing and sending it takes all of Thursday, and review takes two full days before that. When must the draft be ready?'
    options: ['By the end of Wednesday', 'By the end of Tuesday', 'By the end of Monday']
    answer: 2
    feedback:
      - 'That leaves no time for review: Thursday goes on printing, so review has to happen before Thursday.'
      - 'That allows one day of review, Wednesday. Review needs two days, Tuesday and Wednesday, so the draft is due before them.'
      - ''
    explanation: 'Start from the end: Friday morning needs Thursday for printing, Thursday needs Tuesday and Wednesday for review, so the draft is due by the end of Monday.'
  - kind: choice
    id: limits
    prompt: 'When is working backwards from the end most likely to mislead you about what the other side will do?'
    options:
      [
        'When the plan has more than a few steps',
        'When the end is unknown, or others do not look ahead',
        'When the goal is many months away',
      ]
    answer: 1
    feedback:
      - 'Long chains are more work, but the method is the same: Nim takes many moves and still yields to it.'
      - ''
      - 'A distant goal is fine if you know it and know the steps. Projects are planned back from far deadlines all the time.'
    explanation: "Backward induction needs a known end and players who reason the same way. In a Prisoner's Dilemma with a known last round, people often cooperate until near the end, where pure backward induction says they never would."
---

Start at the end of the game and ask who wins there, then step back one move at a time. In Nim, with 0 counters left, the player who just moved has won. So a player facing 1, 2 or 3 wins by taking them all, and a player facing 4 loses, since any take leaves 1 to 3. Facing 5, 6 or 7, you win by leaving 4, and so on: every multiple of 4 is a loss for the player to move. The first move follows from the last.

Game theorists use the same method to solve any game where moves come in turn and the end is known: solve the last decision, assume each player will choose well there, and work back to the first. Counting a chess exchange through to its end is backward induction on the board.

In work, find the end state you need, then the step just before it, and the one before that, until you reach today. The first step is often not the obvious one.

It has limits. It needs a known end and players who look as far ahead as you do. Where the end is uncertain, or people do not reason that far, plan in stages and look again as you learn.

---
term: 'Sunk cost'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Let it go', 'Folding', 'Escalation of commitment']
summary: 'What you have already spent is gone. Decide on what happens next, not on what you put in.'
why: 'Throwing good after bad is one of the most common and costly mistakes people make.'
inLife: 'A failing project, a bad investment or a long queue: the time already spent is not a reason to spend more.'
skill: 'size-risk'
related: ['poker/pot-odds', 'strategy/decisions-not-results']
try:
  - kind: choice
    id: knight
    prompt: 'You spent five moves bringing a knight into an attack. The attack has failed and the knight is now in danger. What should decide your next move?'
    options:
      [
        'The five moves already spent on it',
        'What the knight can do from here',
        'Finishing the attack it was brought for',
      ]
    answer: 1
    feedback:
      - 'Five moves feel like an investment to protect, but they are gone whatever you do next. Only the position in front of you can change.'
      - ''
      - 'Seeing a plan through feels like resolve, but the attack has failed. Pressing on spends more moves on what has stopped working.'
    explanation: 'The five moves are gone either way. Retreat it, trade it or use it, whichever is best from here.'
  - kind: choice
    id: project
    prompt: 'A project has spent 80 of its budget of 100. New figures show that the last 20 will bring back only 10 once it is finished. What do you do?'
    options:
      [
        'Carry on: only 20 more to finish what cost 80',
        'Stop: the next 20 would bring back only 10',
        'Carry on, or the 80 already spent is wasted',
      ]
    answer: 1
    feedback:
      - 'Being nearly done feels like a reason to finish, but the 80 is spent whether you finish or not. The choice is 20 out for 10 back.'
      - ''
      - 'Not wanting the money to be wasted is the trap itself. The 80 is gone either way; carrying on only adds a loss of 10 to it.'
    explanation: 'Only the future costs and gains can change: spending 20 to get 10 back loses 10. How stopping will look is a future cost too and can count, but weigh it honestly; it is usually smaller than more good money after bad.'
---

In poker, folding a hand you have put points into is often right. Your earlier points are no longer yours: they are part of the pot. They make the price of calling look better, which is why pot odds count them, but they are not a reason in themselves to keep going.

In chess, giving up a plan you have spent moves on, once it stops working, is a strength. In organisations the same trap is called escalation of commitment: the more a team has put into a plan, the harder it is to stop.

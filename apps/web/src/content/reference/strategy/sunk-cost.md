---
term: 'Sunk cost'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Let it go', 'Folding']
summary: 'What you have already spent is gone. Decide on what happens next, not on what you put in.'
why: 'Throwing good after bad is one of the most common and costly mistakes people make.'
inLife: 'A failing project, a bad investment or a long queue: the time already spent is not a reason to spend more.'
skill: 'size-risk'
related: ['poker/pot-odds', 'strategy/decisions-not-results']
try:
  - kind: choice
    id: knight
    prompt: 'You spent five moves bringing a knight into an attack. The attack has failed and the knight is now in danger. What should decide your next move?'
    options: ['The five moves already spent on it', 'What the knight can do from here']
    answer: 1
    explanation: 'The five moves are gone either way. Retreat it, trade it or use it, whichever is best from here.'
  - kind: choice
    id: project
    prompt: 'A project has used most of its budget, and new figures show it will not pay back. What should decide whether to carry on?'
    options:
      [
        'How much has been spent already',
        'What the rest will cost against what it will bring',
        'How it will look to stop now',
      ]
    answer: 1
    explanation: 'Only the future costs and gains can change. Money already spent is the same whether you stop or carry on.'
---

In poker, folding a hand you have put points into is often right. In chess, giving up a plan you have spent moves on, once it stops working, is a strength.

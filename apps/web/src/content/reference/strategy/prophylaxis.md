---
term: 'Prophylaxis'
game: 'strategy'
kind: 'principle'
level: 'advanced'
aliases: ['Not so fast', 'Prevention']
summary: "Stop the other side's best plan before it starts, often with a quiet move."
why: 'Preventing a plan is usually cheaper than defending against it once it is running.'
inLife: 'Fix the weak point a rival would attack before they attack it: the missing contract clause, the single supplier.'
skill: 'think-ahead'
related: ['strategy/their-next-move', 'strategy/weakest-link']
lesson: 'strategy/not-so-fast'
try:
  - kind: move
    id: stop-the-pin
    prompt: "Black's bishop on c8 wants to come to g4 and pin the knight to the queen. Which quiet move stops it before it starts?"
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O'
    answers: ['h2h3']
    hint: 'Take g4 away from the bishop.'
    explanation: "h3 covers g4, so the pin never happens. It does nothing on its own, and that is the point: the other side's best plan is gone."
---

The method: ask what the other side would do if it were their move now. If that is dangerous, spend a move preventing it.

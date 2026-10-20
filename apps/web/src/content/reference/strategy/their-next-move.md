---
term: 'Their next move'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Anticipation', 'What do they want?']
summary: 'After every move by the other side, ask what it wants to do next.'
why: 'A move has a purpose. If you see it, you can stop it, or ignore it on purpose; if you do not, it happens to you.'
inLife: 'When a competitor cuts a price or a colleague changes a plan, ask what it sets up, not just what it does today.'
skill: 'think-ahead'
related: ['strategy/blunder-check', 'strategy/prophylaxis']
lesson: 'strategy/their-next-move'
try:
  - kind: choice
    id: what-it-wants
    prompt: 'White has just played Qh5. What does it want to do next?'
    position: 'moves: e4 e5 Bc4 Nc6 Qh5'
    options: ['Qxf7, checkmate', 'Qxe5, taking a pawn with check', 'Qxh7, taking a pawn']
    answer: 0
    feedback:
      - ''
      - 'Qxe5 would give check and take a pawn, which looks like a threat. But the knight on c6 guards e5, so the queen would be lost.'
      - 'Qxh7 does take a pawn, but the rook on h8 takes the queen straight back.'
    highlight: ['f7']
    arrows: ['h5f7', 'c4f7']
    explanation: 'The queen and bishop both aim at f7, and only the king guards it. Qxf7 would be mate. Qxe5+ is not a threat here: the knight on c6 guards e5.'
  - kind: move
    id: stop-it
    prompt: 'Now stop it, without giving anything away.'
    position: 'moves: e4 e5 Bc4 Nc6 Qh5'
    orientation: 'black'
    answers: ['g7g6', 'd8e7', 'd8f6']
    hint: 'Guard f7, or chase the queen away.'
    explanation: 'g6 chases the queen, and Qe7 or Qf6 guard f7. Nf6, which looks natural, allows Qxf7 mate: that is why you ask what their move wants.'
---

The question is short: what does that move want? It might attack something, prepare an attack, or free a piece. Name it, then decide whether it matters.

Beginners look only at their own plans. The step up is to look at the board through the other side's eyes once per move.

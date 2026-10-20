---
term: 'Cooperate or defend'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Trust and reputation']
summary: 'When you will meet again, cooperation and reputation pay. In a one-off, protect yourself.'
why: 'Many situations are repeated games. What you do now changes how others treat you later.'
inLife: 'Suppliers, neighbours and colleagues are repeated games; a one-time sale to a stranger is not.'
skill: 'cooperate'
related: ['labs/prisoners-dilemma', 'labs/tit-for-tat']
try:
  - kind: choice
    id: long-term
    prompt: 'You will work with a supplier for years. They make a small mistake in your favour on an invoice. What pays best?'
    options:
      ['Keep quiet and take it', 'Point it out: the relationship is worth more', 'Use it to ask for a bigger discount']
    answer: 1
    explanation: 'When you will meet again, trust and reputation pay back many times what one invoice gains.'
  - kind: choice
    id: one-off
    prompt: 'A one-off sale to a stranger you will never meet again. How do you deal?'
    options: ['Trust them fully', 'Protect yourself: payment before the goods go']
    answer: 1
    explanation: 'With no future between you, neither side gains from good behaviour later. Protect yourself in the terms.'
---

The Prisoner's Dilemma shows the tension: each side does better alone by defecting, but both do better together by cooperating, if the game repeats.

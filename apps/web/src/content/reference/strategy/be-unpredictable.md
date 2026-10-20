---
term: 'Be unpredictable'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Mixed strategy', 'Mix it up']
summary: 'If the other side can predict you, they can exploit you. Sometimes the best plan is to vary.'
why: 'Any fixed habit becomes a weakness against an opponent who notices it.'
inLife: 'Negotiators, sports teams and security planners vary their approach so it cannot be planned against.'
skill: 'unpredictable'
related: ['labs/mixed-strategy', 'poker/bluff']
try:
  - kind: choice
    id: always-bluff
    prompt: 'A player bets big only when they have nothing. What does a watchful opponent do?'
    options: ['Call every big bet', 'Fold more often', 'Nothing changes']
    answer: 0
    explanation: 'A pattern that can be read can be used. Once big bets always mean nothing, calling them always wins.'
  - kind: choice
    id: penalty
    prompt: "A penalty taker always shoots to the keeper's left. What should they do instead?"
    options:
      [
        'Keep shooting left: it has worked so far',
        'Mix their side so the keeper cannot know',
        'Always shoot to the middle',
      ]
    answer: 1
    explanation: 'Mixing so the other side cannot predict you is often the best plan. Any fixed choice, even a good one, can be read.'
---

Varying is not the same as acting at random. You mix good options in proportions that leave the other side no reliable answer.

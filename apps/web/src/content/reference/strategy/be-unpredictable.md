---
term: 'Be unpredictable'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Mixed strategy', 'Mix it up']
summary: 'If the other side can predict you, they can exploit you. Sometimes the best plan is to vary.'
why: 'Where someone is working against you, a fixed habit is a weakness. Where people rely on you, being predictable is a strength.'
inLife: 'Penalty takers, sports teams and security planners vary their approach so a rival cannot plan against it. With partners, staff and customers, be reliable instead.'
skill: 'unpredictable'
related: ['labs/mixed-strategy', 'poker/bluff']
try:
  - kind: choice
    id: always-bluff
    prompt: 'A player bets big only when they have nothing. What does a watchful opponent do?'
    options:
      ['Call every big bet', 'Fold to big bets, as most players do', 'Call some big bets, in case the read is wrong']
    answer: 0
    feedback:
      - ''
      - 'Folding to big bets is sound against most players, because big bets usually mean strength. Against this player they mean the opposite.'
      - 'Caution feels safe, but the pattern is complete: every big bet is a bluff. Each fold hands over points you could have won.'
    explanation: 'A pattern that can be read can be used. Once big bets always mean nothing, calling them always wins.'
  - kind: choice
    id: penalty
    prompt: "A penalty taker always shoots to the keeper's left. What should they do instead?"
    options:
      [
        'Keep shooting left: it has worked so far',
        'Mix sides, leaning to their stronger side',
        'Switch to always shooting right',
      ]
    answer: 1
    feedback:
      - 'A record of goals feels like proof, but a keeper who has watched the pattern will dive left, and then it stops working.'
      - ''
      - 'Breaking the old habit feels like the fix, but a new fixed habit is just as easy to read once the keeper notices it.'
    explanation: 'Mixing so the other side cannot predict you is often the best plan. The mix need not be even: real penalty takers shoot to their stronger side more often, but never always.'
---

Varying is not the same as acting at random. You mix good options in proportions that leave the other side no reliable answer.

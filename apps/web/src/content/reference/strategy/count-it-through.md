---
term: 'Count it through'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Calculation', 'Exchange counting']
summary: 'Follow a sequence of moves to its end before you start it, counting what each side wins.'
why: 'Starting a sequence you have not finished counting is a gamble. Counting to the end turns it into a decision.'
inLife: 'Work out every step of a plan, with costs, before committing the first resource to it.'
skill: 'calculate'
related: ['chess/piece-values', 'strategy/shrink-the-problem']
lesson: 'strategy/count-it-through'
try:
  - kind: choice
    id: count-d5
    prompt: 'White can take on d5 with the knight. The pawn is attacked twice and defended twice. Count it through: is taking good?'
    position: '6k1/pp3ppp/4pn2/3p4/8/1BN5/PP3PPP/6K1 w - - 0 1'
    options: ['Yes, it wins a pawn', 'No: White gives two pieces for two pawns', 'It comes out even']
    answer: 1
    highlight: ['d5']
    explanation: 'Nxd5 exd5 Bxd5 Nxd5: White takes two pawns and loses a knight and a bishop. Stopping after the first capture makes it look like a free pawn.'
---

In a series of captures on one square, count attackers and defenders, then add up what is taken in order. Stop counting only when no capture is left that either side would want.

The common error is stopping one move early, at the moment that looks good for you.

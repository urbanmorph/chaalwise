---
term: 'The blunder check'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Pre-mortem', 'Checks, captures and threats']
summary: 'Before you act, ask what your move allows the other side to do.'
why: 'Most games, and many decisions, are lost to one oversight rather than a lack of brilliance. A short, fixed check catches the oversight while it is still cheap.'
inLife: 'Before you send the email, sign the contract or make the offer, ask: what could go wrong, and what will they do next?'
skill: 'think-ahead'
related: ['strategy/their-next-move', 'chess/hanging-piece', 'chess/fork']
lesson: 'strategy/blunder-check'
try:
  - kind: choice
    id: what-it-allows
    prompt: 'White would like to play Bxf7+, taking a pawn with check. Check first: what does it allow?'
    position: '3q2k1/pp3ppp/5n2/8/2B5/8/PP2QPPP/6K1 w - - 0 1'
    options: ['Nothing: it wins a pawn', 'The king takes the bishop', "Black's queen takes the bishop"]
    answer: 1
    highlight: ['f7']
    arrows: ['g8f7']
    explanation: 'Nothing guards the bishop on f7, so the king simply takes it. A check is not a reason to skip the question: what does this let the other side do?'
---

In chess the check is three questions, for both sides: which checks, which captures and which threats are there? Asking them every move turns a vague worry into a habit.

The habit matters more than the speed. Players who check every move, even slowly, beat players who calculate brilliantly but only sometimes look.

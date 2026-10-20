---
term: 'Fix your weakest link'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Improve your worst piece']
summary: 'When there is nothing urgent, improve the part of your position that is doing least.'
why: 'A position, like a team, is often limited by its weakest member, not its strongest.'
inLife: 'When a project has no crisis, spend the time on the slowest step or the least-supported person.'
skill: 'plan-long'
related: ['strategy/prophylaxis', 'chess/development']
try:
  - kind: choice
    id: which-piece
    prompt: 'Nothing is urgent. Which White piece is doing least?'
    position: '5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1'
    options: ['The knight on f3', 'The bishop on c1', 'The pawn on h2']
    answer: 1
    highlight: ['c1']
    explanation: 'The bishop is shut in by its own pawns on b2 and e3. It has one square, d2, and touches nothing.'
  - kind: move
    id: free-it
    prompt: 'Start fixing it. Which pawn move opens a road for the bishop?'
    position: '5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1'
    answers: ['b2b3', 'e3e4', 'b2b4']
    hint: 'The bishop needs b2 or e3 to move out of the way.'
    explanation: "After b3 the bishop can come to a3 and offer to trade itself for Black's good bishop on d6. After e4 the long road to h6 opens. Either way the weakest piece joins the game."
---

In chess this is often a piece with no good square, such as a bishop blocked by its own pawns. Find it a better square before starting anything new.

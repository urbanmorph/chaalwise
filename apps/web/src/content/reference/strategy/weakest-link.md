---
term: 'Fix your weakest link'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Improve your worst piece']
summary: 'When there is nothing urgent, improve the part of your position that is doing least.'
why: 'When the parts depend on each other, as the pieces in a position or the steps in a production line do, the weakest one sets the limit. Where one great result is enough, invest in your strongest instead.'
inLife: 'When a project has no crisis, spend the time on the slowest step or the least-supported person.'
skill: 'plan-long'
related: ['strategy/prophylaxis', 'chess/development']
lesson: 'strategy/fix-your-weakest-link'
try:
  - kind: choice
    id: which-piece
    prompt: 'Nothing is urgent. Which White piece is doing least?'
    position: '5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1'
    options: ['The knight on f3', 'The bishop on c1', 'The rook on f1']
    answer: 1
    feedback:
      - 'The knight looks quiet, but from f3 it guards d4 and e5 and watches the centre.'
      - ''
      - 'The rook is not yet on an open file, but it guards f2 and can move along the first rank. The bishop cannot do even that.'
    highlight: ['c1']
    explanation: 'The bishop is shut in by its own pawns on b2 and e3. It has one square, d2, and touches nothing.'
  - kind: move
    id: free-it
    prompt: 'Start fixing it. Which pawn move opens a road for the bishop, without giving anything away?'
    position: '5rk1/pp3ppp/2pbpn2/3p4/3P4/2P1PN2/PP3PPP/2B2RK1 w - - 0 1'
    answers: ['b2b3', 'b2b4']
    hint: 'The bishop can get out through b2. Which pawn stands there?'
    explanation: "After b3 the bishop can come to a3 and offer to trade itself for Black's good bishop on d6; b4 also opens b2 and a3 for it. e4 would open the other road, but after dxe4 nothing can take back, so the pawn is lost for nothing."
---

In chess this is often a piece with no good square, such as a bishop blocked by its own pawns. Find it a better square before starting anything new.

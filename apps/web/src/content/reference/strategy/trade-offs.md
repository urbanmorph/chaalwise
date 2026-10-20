---
term: 'Trade-offs'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Give a little, get more', 'Sacrifice', 'Opportunity cost']
summary: 'Material, time and position can be exchanged for one another. Give one up only for more of another.'
why: 'Most real decisions are not free wins but trades. Seeing all three currencies lets you trade well.'
inLife: 'Spending money to save time, or time to build a better position later, is the same calculation.'
skill: 'size-risk'
related: ['strategy/simplify-when-ahead', 'chess/tempo', 'chess/gambit']
lesson: 'strategy/give-a-little-get-more'
try:
  - kind: move
    id: good-trade
    prompt: 'Give one thing up only for more of another. Two captures are on offer; one wins material. Find it.'
    position: '6k1/5ppp/5r2/3p4/4n3/8/1B3PPP/4R1K1 w - - 0 1'
    answers: ['b2f6']
    hint: 'Count what you give and what you get back after the recapture.'
    explanation: 'Bxf6 gxf6 gives a bishop (3) for a rook (5). Rxe4 dxe4 would give a rook for a knight, the same trade the wrong way round.'
  - kind: choice
    id: two-pawns
    prompt: 'White has given away two pawns in the first five moves. What has White got for them?'
    position: 'moves: e4 e5 d4 exd4 c3 dxc3 Bc4 cxb2 Bxb2'
    options:
      [
        'Time: two bishops in play while Black has none',
        'Nothing yet: two pawns down is simply worse',
        'Material later: the pawns come back by force',
      ]
    answer: 0
    feedback:
      - ''
      - 'Counting only material makes it look lost. But Black has not moved a piece, and both White bishops already aim at the king side.'
      - 'Many gambits do win the pawn back, but nothing here forces it. The pawns pay for time, and White has to use it.'
    highlight: ['c4', 'b2']
    arrows: ['c4f7', 'b2g7']
    explanation: 'Two pawns bought two developed bishops, aimed at f7 and g7, while Black has nothing out. Whether that is enough depends on using the time before Black catches up: that is the trade.'
---

A gambit gives a pawn for time. A sacrifice gives a piece for an attack. Both are good only if what you get is worth more than what you give, and you can show how.

What you give up is the cost, even when no money changes hands. Economists call it opportunity cost: the value of the best thing you could have done instead.

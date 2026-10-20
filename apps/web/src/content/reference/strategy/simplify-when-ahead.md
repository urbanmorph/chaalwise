---
term: 'Simplify when ahead'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Trade down', 'Convert the advantage']
summary: 'When you are ahead, reduce the risk: trade pieces and head for a position where your advantage is easy to use.'
why: 'An advantage only counts once it is converted. Fewer pieces means fewer ways for things to go wrong.'
inLife: 'When a sure, modest win is worth more to you than a bigger but riskier one, such as a deadline you must meet or a contract you only need to close, remove the moving parts that could still fail. Do not mistake this for cashing in every gain early.'
skill: 'size-risk'
related: ['chess/piece-values', 'strategy/trade-offs']
try:
  - kind: move
    id: trade-rooks
    prompt: "White is a bishop ahead. Black's rook challenges on the d-file. Make the move that trades rooks and leaves an easy win."
    position: '3r4/p3kppp/8/8/2B5/8/P4PPP/3R2K1 w - - 0 1'
    answers: ['d1d8']
    explanation: 'Rxd8 Kxd8 leaves a bishop against nothing: fewer pieces, fewer ways for Black to make trouble, and the extra piece is easy to use.'
---

Trade pieces, not pawns: with fewer pieces left, an extra pawn or piece matters more. The side that is behind wants complications; deny them.

---
title: Piece values and good trades
summary: Pawn 1, knight 3, bishop 3, rook 5, queen 9. A trade is good if you get more than you give.
game: chess
stage: 0
order: 7
skills: [calculate]
measures: calculation
steps:
  - kind: choice
    id: values
    prompt: Roughly how many points is each piece worth?
    options:
      - Pawn 1, knight 3, bishop 3, rook 5, queen 9
      - Pawn 1, knight 2, bishop 3, rook 5, queen 9
      - Pawn 1, knight 3, bishop 5, rook 3, queen 9
    answer: 0
    feedback:
      - ''
      - 'The knight moves only a short way, but it jumps and forks. It is worth about the same as a bishop, 3.'
      - "Bishop and rook are swapped. A rook can reach every square of the board, so it is worth more, 5 to the bishop's 3."
    explanation: These rough values tell you whether a trade is good. Most players rate a bishop slightly above a knight, and the pair of bishops about half a pawn extra. The king is beyond price, because losing it loses the game.
  - kind: choice
    id: bad-trade
    prompt: Your rook can take a black knight, but then a black pawn takes your rook. Is that a good trade?
    options:
      - No, you give 5 points for 3
      - Yes, you took first
      - It is even, a piece for a piece
    answer: 0
    feedback:
      - ''
      - 'Taking first does not decide it. Count both captures. You get 3 and give 5.'
      - 'Pieces are not all equal. A rook is worth 5 and a knight 3, so you lose 2 points.'
    explanation: Count what you get and what you give. A knight (3) for a rook (5) loses 2 points.
  - kind: move
    id: take-the-most
    prompt: Two black pieces can be taken. Take the one that wins the most.
    position: 4k3/3n4/8/8/r2Q4/8/8/4K3 w - - 0 1
    answers: [d4a4]
    hint: Is either of them defended?
    explanation: The rook is worth 5 and nothing defends it. The knight is defended by the king, so Qxd7+ Kxd7 would give your queen for a knight.
---

Some pieces are worth more than others. The values let you count a trade before you make it.

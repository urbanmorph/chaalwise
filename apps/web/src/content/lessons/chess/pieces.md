---
title: How the pieces move
summary: Rook, bishop, queen, king, knight and pawn, one move each.
game: chess
stage: 0
order: 3
skills: []
steps:
  - kind: move
    id: rook
    prompt: The rook moves in straight lines, along ranks and files. Move it as far up the board as it can go.
    position: 4k3/8/8/8/8/8/8/R3K3 w - - 0 1
    answers: [a1a8]
    hint: Straight up the a-file.
    explanation: Ra8 also gives check along the back rank. Rooks love open lines.
  - kind: move
    id: bishop
    prompt: The bishop moves diagonally and stays on one colour all game. Move it to the far corner.
    position: 4k3/8/8/8/8/8/1B6/4K3 w - - 0 1
    answers: [b2h8]
    hint: Follow the long diagonal up and to the right.
    explanation: A bishop on the long diagonal sees right across the board.
  - kind: move
    id: knight
    prompt: The knight jumps in an L, two squares one way and one to the side, over anything in between. Move a knight to f3.
    position: start
    answers: [g1f3]
    hint: The knight on g1 can reach f3.
    explanation: A knight always lands on the other colour from where it started.
  - kind: choice
    id: queen
    prompt: The queen moves like which two pieces together?
    options:
      - A rook and a bishop
      - A rook and a knight
      - A bishop and a knight
    answer: 0
    explanation: The queen moves any distance in straight lines and on diagonals. That is why she is worth about nine pawns.
  - kind: choice
    id: king
    prompt: How far can the king move?
    options:
      - One square in any direction
      - Any distance, like the queen
      - Two squares at a time
    answer: 0
    explanation: One square in any direction, but never onto a square an enemy piece attacks.
  - kind: move
    id: pawn-capture
    prompt: A pawn moves straight forward but captures diagonally. Take the black pawn.
    position: 4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1
    answers: [e4d5]
    hint: Your pawn on e4 takes one square diagonally forward.
    explanation: Pawns never move backwards and never capture straight ahead.
  - kind: choice
    id: values
    prompt: Roughly how many points is each piece worth?
    options:
      - Pawn 1, knight 3, bishop 3, rook 5, queen 9
      - Pawn 1, knight 5, bishop 3, rook 3, queen 10
      - All pieces except the king are worth the same
    answer: 0
    explanation: These rough values tell you whether a trade is good. The king is beyond price, because losing it loses the game.
---

Six kinds of piece, each with its own move. Make one move with each.

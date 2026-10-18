---
title: Take what is hanging
summary: Spot pieces you can win for nothing, and the habit that stops you giving yours away.
game: chess
stage: 1
order: 1
skills: [think-ahead]
steps:
  - kind: read
    id: what-hanging-means
    text: A piece is hanging when you can take it and nothing takes back, or when you can take it with something worth less.
  - kind: move
    id: free-knight
    prompt: Black's knight on d5 has no defender. Win it.
    position: 4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1
    answers: [d1d5]
    hint: Your queen on d1 looks straight up the d-file.
    explanation: Nothing defends d5, so your queen wins a knight for free.
  - kind: move
    id: cheaper-attacker
    prompt: Black's rook on e5 is defended by the pawn on f6. Win material anyway.
    position: 4k3/8/5p2/4r3/3P4/8/8/4K3 w - - 0 1
    answers: [d4e5]
    hint: Which of your pieces is worth the least?
    explanation: Your pawn is worth one point and the rook five. After f6 takes back, you are still four points ahead. Taking with something cheaper wins material even when the piece is defended.
  - kind: choice
    id: blunder-check
    prompt: Before every move, what do you look for, for both sides?
    options:
      - Checks, captures and threats
      - Pins, forks and skewers
      - The centre, development and castling
    answer: 0
    explanation: Checks, captures and threats, yours and your opponent's, before every move. This is the blunder check, and it is the habit that stops you leaving pieces hanging.
---

Most games between beginners are decided by a piece left where it can be taken for free. Learn to see those pieces, on both sides of the board.

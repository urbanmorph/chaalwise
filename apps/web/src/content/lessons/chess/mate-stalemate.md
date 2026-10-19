---
title: Checkmate, stalemate and other draws
summary: How games are won, and the draws that catch beginners out.
game: chess
stage: 0
order: 11
skills: [think-ahead]
steps:
  - kind: choice
    id: is-it-mate
    prompt: It is Black to move. What is this?
    position: k7/1Q6/1K6/8/8/8/8/8 b - - 0 1
    options:
      - Checkmate
      - Stalemate
      - Neither
    answer: 0
    explanation: The king on a8 is in check from the queen. It cannot take her because your king guards her, and every square it could go to is covered. That is checkmate.
    highlight: [a8]
  - kind: choice
    id: is-it-stalemate
    prompt: It is Black to move. What is this?
    position: k7/8/1Q6/8/8/8/8/4K3 b - - 0 1
    options:
      - Checkmate
      - Stalemate
      - Neither
    answer: 1
    explanation: The king is not in check, but it has no legal move. That is stalemate, and stalemate is a draw, however much material you have.
    highlight: [a8]
  - kind: choice
    id: too-little
    prompt: Only the two kings are left. What happens?
    options:
      - It is a draw, because neither side can ever give mate
      - The side to move wins
      - The game goes on until someone resigns
    answer: 0
    explanation: Without enough material to mate, the game is drawn. A draw also comes from the same position three times, or from agreeing one.
  - kind: move
    id: mate-in-one
    prompt: Give checkmate in one move.
    position: k7/8/1K6/8/8/8/7Q/8 w - - 0 1
    answers: [h2h8]
    hint: Check along the back rank. Your king already covers a7 and b7.
    explanation: The queen checks along the back rank, and your king covers the two squares in front. The king has nowhere to go.
---

The goal of chess is checkmate: the king is attacked and has no way out. Stalemate looks similar and is a draw.

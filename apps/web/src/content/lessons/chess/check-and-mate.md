---
title: Check, checkmate and stalemate
summary: How games are won, and the draw that catches beginners out.
game: chess
stage: 0
order: 5
skills: [think-ahead]
steps:
  - kind: move
    id: escape-check
    prompt: Your king is in check from the rook. Get out of check by taking it.
    position: 4k3/8/8/8/8/8/4r3/4K3 w - - 0 1
    answers: [e1e2]
    hint: Nothing protects the rook, so your king can take it.
    explanation: There are three ways out of check. Move the king, block the line, or capture the checking piece. Here capturing wins a rook.
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
  - kind: move
    id: mate-in-one
    prompt: Give checkmate in one move.
    position: k7/8/1K6/8/8/8/7Q/8 w - - 0 1
    answers: [h2h8]
    hint: Check along the back rank. Your king already covers a7 and b7.
    explanation: The queen checks along the back rank, and your king covers the two squares in front. The king has nowhere to go.
---

The goal of chess is checkmate: the king is attacked and has no way out. Stalemate looks similar and is a draw.

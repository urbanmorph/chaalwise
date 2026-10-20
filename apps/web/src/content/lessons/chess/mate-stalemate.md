---
title: Checkmate, stalemate and other draws
summary: How games are won, and the draws that catch beginners out.
game: chess
stage: 0
order: 9
skills: [think-ahead]
measures: board
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
    feedback:
      - ''
      - 'Stalemate means no legal move and no check. Here the queen on b7 gives check, so it is mate.'
      - 'The king seems able to take the queen, but your king on b6 guards her, and a7 and b8 are covered too.'
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
    feedback:
      - 'Every square around the king is covered, but the king is not in check. Without check it is not mate.'
      - ''
      - 'Black must move, and the king has no legal square. With no other black pieces, that is stalemate.'
    explanation: The king is not in check, but it has no legal move. That is stalemate, and stalemate is a draw, however much material you have.
    highlight: [a8]
  - kind: choice
    id: too-little
    prompt: Only the two kings are left. What happens?
    options:
      - It is a draw, because neither side can ever give mate
      - The game goes on until fifty moves pass without a capture
      - The player with more time left on the clock wins
    answer: 0
    feedback:
      - ''
      - 'The fifty-move rule is real, but there is no need to wait. With no way to mate, the game is drawn at once.'
      - 'A clock decides only while mate is still possible. Even if one side runs out of time here, it is a draw.'
    explanation: When neither side can ever give mate, the game is drawn at once. That covers king against king, and king and bishop or king and knight against a lone king. A game is also drawn when the same position comes three times, when fifty moves each pass with no capture and no pawn move, or when both players agree. Online sites apply most of these automatically; over the board you claim them.
  - kind: move
    id: mate-in-one
    measures: patterns
    prompt: Give checkmate in one move.
    position: k7/8/1K6/8/8/8/7Q/8 w - - 0 1
    answers: [h2h8]
    hint: Check along the back rank. Your king already covers a7 and b7.
    explanation: The queen checks along the back rank, and your king covers the two squares in front. The king has nowhere to go.
---

The goal of chess is checkmate: the king is attacked and has no way out. Stalemate looks similar and is a draw.

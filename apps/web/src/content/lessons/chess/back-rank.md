---
title: Back-rank mate
summary: A king hemmed in by its own pawns, mated along the back rank, and how to stop it.
game: chess
stage: 2
order: 1
skills: [think-ahead]
steps:
  - kind: move
    id: rook-mates
    prompt: White to move. Mate along the back rank.
    position: 6k1/5ppp/8/8/8/8/1q3PPP/4R1K1 w - - 0 1
    answers: [e1e8]
    hint: The black king cannot step forward, because its own pawns are in the way.
    explanation: Re8 is mate. The pawns on f7, g7 and h7 box their own king in.
  - kind: move
    id: black-mates
    prompt: Now Black does the same to White. Find the mate.
    position: 4r1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1
    answers: [e8e1]
    hint: White's king has the same problem.
    explanation: Re1 is mate. Every player should spot this pattern, for both sides, at a glance.
  - kind: move
    id: luft
    prompt: Make your king safe from a back-rank mate with one pawn move.
    position: 4r1k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    answers: [h2h3, h2h4, g2g3, g2g4, f2f3, f2f4]
    hint: Give the king a square to step to off the back rank.
    explanation: A pawn move that gives the king a square is called luft, German for air. h3 is the usual choice.
---

The most common checkmate in beginners' games happens on the back rank. See it coming, for both sides.

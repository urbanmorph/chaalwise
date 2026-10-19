---
title: What changes in the endgame
summary: With few pieces left, the king becomes a fighter and passed pawns decide.
game: chess
stage: 6
order: 0
skills: [plan-long]
steps:
  - kind: read
    id: what-changes
    text: In the endgame most pieces are gone, and two things change. The king, which hid all game, becomes a strong piece. And pawns become precious, because a pawn that reaches the last rank becomes a queen.
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    highlight: [b4]
  - kind: choice
    id: king-where
    prompt: In the endgame, where should your king usually be?
    options:
      - Towards the centre, where it can attack and defend
      - In the corner, out of harm's way
    answer: 0
    explanation: With the queens gone, mating attacks are rare, so the king can come out and fight.
  - kind: choice
    id: passed-pawn
    prompt: A passed pawn has no enemy pawn in front of it or on the files beside it. Is the b-pawn passed?
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    options:
      - Yes, no black pawn can stop it
      - No, the black king is in the way
    answer: 0
    explanation: Only pawns count. The black king can still try to catch it, which is the next lesson's question.
    highlight: [b4]
  - kind: move
    id: push-it
    prompt: Passed pawns must be pushed. Push yours.
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    answers: [b4b5]
    hint: Move it one square towards the last rank.
    explanation: Each push brings promotion closer. In the coming lessons you will learn when the king can stop it, and how your king helps.
---

The endgame is where advantages become wins, and where the rules of thumb change.

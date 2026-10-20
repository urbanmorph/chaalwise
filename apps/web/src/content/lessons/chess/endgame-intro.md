---
title: What changes in the endgame
summary: With few pieces left, the king becomes a fighter and passed pawns decide.
game: chess
stage: 6
order: 0
skills: [plan-long]
measures: endgame
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
      - Still behind its pawns, as in the middlegame
    answer: 0
    feedback:
      - ''
      - 'That was right while the queens were on. With few pieces left, a king in the corner is a piece doing nothing.'
      - 'Hiding made sense with many pieces about. Now mate is unlikely, and the king is needed to fight.'
    explanation: With the queens gone, mating attacks are rare, so the king can come out and fight.
  - kind: choice
    id: passed-pawn
    prompt: A passed pawn has no enemy pawn in front of it, on its own file or on either file next to it. Is the b-pawn passed?
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    options:
      - Yes, no black pawn can stop it
      - No, the black king is in the way
      - No, it has not crossed the middle yet
    answer: 0
    feedback:
      - ''
      - 'Kings and pieces do not count, only pawns. The king may still catch it, but the pawn is passed.'
      - 'A pawn can be passed anywhere on the board. What counts is that no enemy pawn stands ahead of it.'
    explanation: Only pawns count. Whether the black king can still catch it is a matter of counting. Look up the square of the pawn in the reference.
    highlight: [b4]
  - kind: move
    id: push-it
    prompt: Passed pawns must be pushed. Push yours.
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    answers: [b4b5]
    hint: Move it one square towards the last rank.
    explanation: Each push brings promotion closer. To see when the enemy king can stop it, and how your own king helps, look up the square of the pawn and the opposition in the reference.
---

The endgame is where advantages become wins, and where the rules of thumb change.

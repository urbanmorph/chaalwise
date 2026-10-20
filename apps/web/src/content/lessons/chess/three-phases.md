---
title: The three phases of a game
summary: Opening, middlegame and endgame, what each is for, and how to tell which one you are in.
game: chess
stage: 3
order: 0
skills: [plan-long]
measures: opening
steps:
  - kind: read
    id: opening
    text: In the opening both sides bring out their pieces, fight for the centre and castle. It usually lasts ten to fifteen moves, and it is over once the pieces are out and the kings are safe.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Bc5 O-O Nf6'
    highlight: [c4, c5, f3, c6, f6, g1]
  - kind: read
    id: middlegame
    text: In the middlegame the pieces are out. Now each side makes a plan from the pawn structure, and attacks or defends. Most games are decided here.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 Nbd2 Be6 Nf1 h6'
  - kind: read
    id: endgame
    text: In the endgame few pieces are left. The king, hidden all game, becomes a fighting piece, and a pawn that can run to the last rank, a passed pawn, often decides.
    position: 8/8/4k3/8/1P6/8/5K2/8 w - - 0 1
    highlight: [b4]
  - kind: choice
    id: which-phase-1
    prompt: Which phase is this?
    position: 'moves: e4 e5 Nf3 Nc6'
    options:
      - The opening
      - The middlegame
      - The endgame
    answer: 0
    feedback:
      - ''
      - 'The middlegame starts once the pieces are out. Here most are still at home.'
      - 'Every piece is still on the board. The endgame comes when most of them are gone.'
    explanation: Only two moves each, and most pieces are still at home. The opening has just begun.
  - kind: choice
    id: which-phase-2
    prompt: And this one?
    position: 6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    options:
      - The opening
      - The middlegame
      - The endgame
    answer: 2
    feedback:
      - 'The kings are still on their back ranks, but almost every piece is gone. That makes it an endgame.'
      - 'With only a rook and pawns left, there are no pieces to build a middlegame plan around. It is an endgame.'
      - ''
    explanation: A white rook and a few pawns each side, and nothing else. That is an endgame, even though the kings are still on their first ranks.
  - kind: choice
    id: when-opening-ends
    prompt: When is the opening over?
    options:
      - When both sides have brought out their pieces and castled
      - After ten to fifteen moves, whatever is on the board
      - When the first piece or pawn is captured
    answer: 0
    feedback:
      - ''
      - 'That is how long it usually lasts, not what ends it. A slow opening can run longer.'
      - 'Captures often happen while pieces are still coming out. The opening ends when development is done.'
    explanation: The phases are about what is happening on the board, not a move count. Once development is done, you need a plan, and that is the middlegame.
---

A game has three phases, and each asks a different question. Knowing which one you are in tells you what to think about.

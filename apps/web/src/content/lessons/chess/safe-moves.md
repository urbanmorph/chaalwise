---
title: Is this move safe?
summary: Before you let go of a piece, check that they cannot win something or mate you straight after.
game: chess
stage: 1
order: 6
skills: [think-ahead, calculate]
measures: safety
steps:
  - kind: read
    id: the-question
    text: A move is safe if, straight after it, your opponent cannot win material or give mate. Count each exchange. A cheaper piece taking a dearer one wins, even if you can take back.
  - kind: choice
    id: early-g6
    prompt: Black wants to chase White's queen away with ...g6. Is that safe?
    position: 'moves: e4 e5 Qh5'
    options:
      - Safe
      - Not safe
    answer: 1
    explanation: After ...g6, Qxe5+ wins the e5 pawn with check, and the queen then attacks the rook on h8 too. Defend e5 first, with ...Nc6.
  - kind: choice
    id: knight-takes
    prompt: Can White win a pawn with Nxe5 here?
    position: 'moves: e4 e5 Nf3 Nc6'
    options:
      - Yes, the pawn is free
      - No, the knight on c6 takes back
    answer: 1
    explanation: The knight on c6 defends e5. After Nxe5 Nxe5, White has given a knight (3) for a pawn (1).
  - kind: choice
    id: two-knights
    prompt: White's knight on g5 and bishop on c4 both attack f7. Is ...Bc5, developing, safe for Black?
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5'
    options:
      - Safe
      - Not safe
    answer: 1
    explanation: After ...Bc5, Nxf7 wins a pawn and attacks the queen and the rook at once. Black must deal with f7 first, usually with ...d5.
  - kind: move
    id: defend-f7
    prompt: Block the bishop's attack on f7 with a pawn, safely.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5'
    answers: [d7d5]
    hint: A pawn in the middle can cut the bishop's line to f7.
    explanation: ...d5 shuts the bishop out. After exd5, Black usually plays ...Na5, attacking the bishop. Taking back with ...Nxd5 is the risky line, because Nxf7 (the Fried Liver attack) drags the king out.
---

This one question, asked before every move, saves more games than any opening.

---
title: The pin
summary: Freeze a piece in front of a more valuable one, then attack it.
game: chess
stage: 4
order: 2
skills: [calculate]
measures: patterns
steps:
  - kind: read
    id: what-a-pin-is
    text: 'A pin is an attack on a piece that cannot move without exposing a more valuable piece behind it. Here the knight on c6 stands in front of the king. Moving it would leave the king in check, so it may not move at all. Bishops, rooks and queens pin.'
    position: 4k3/1p3ppp/2n5/1B6/3P4/8/PP3PPP/6K1 w - - 0 1
    highlight: [b5, c6, e8]
  - kind: move
    id: pin-the-queen
    prompt: Pin Black's queen to the king.
    position: 4k3/3q1ppp/8/8/P7/8/5PPP/5BK1 w - - 0 1
    answers: [f1b5]
    hint: Which diagonal joins the queen on d7 and the king on e8?
    explanation: Bishop to b5 pins the queen. It can only take the bishop, and the a-pawn takes back. You win a queen for a bishop.
  - kind: choice
    id: can-it-move
    prompt: "It is Black's move. Can the knight on c6 move?"
    position: 4k3/1p3ppp/2n5/1B6/3P4/8/PP3PPP/6K1 b - - 0 1
    options:
      - No, moving it would expose the king
      - Yes, but White would then win the king
      - Yes, a knight can jump out of a pin
    answer: 0
    feedback:
      - ''
      - 'No move may leave your own king in check, so the move is not allowed at all.'
      - 'Jumping does not help. Once the knight leaves c6, the bishop sees the king.'
    explanation: A pin to the king is absolute, so the pinned piece cannot legally move. A pin to anything else only costs material if the piece moves.
    highlight: [c6]
  - kind: move
    id: attack-the-pinned
    prompt: The knight cannot run. Attack it and win it.
    position: 4k3/1p3ppp/2n5/1B6/3P4/8/PP3PPP/6K1 w - - 0 1
    answers: [d4d5]
    hint: Attack the pinned piece with something cheap.
    explanation: The pawn on d5 attacks the knight, and the knight cannot move. You win a knight for at most a pawn. Pile up on a pinned piece, because it cannot get away.
  - kind: choice
    id: break-the-pin
    prompt: Black to move. White threatens d5, attacking the pinned knight. Which move saves it?
    position: 4k3/1p3ppp/2n5/1B6/3P4/8/PP3PPP/6K1 b - - 0 1
    options:
      - ...Ke7, stepping off the line
      - ...Kd7, guarding the knight
      - ...h6, giving the king room
    answer: 0
    feedback:
      - ''
      - "d7 is still on the bishop's diagonal, behind the knight. The pin holds, and d5 wins the knight."
      - 'The king gains a square, but the knight is still pinned, and d5 wins it.'
    explanation: Once the king leaves the line, the knight is free to move away from the pawn. Break a pin before it is attacked.
    highlight: [e7]
  - kind: move
    id: pinned-cannot-defend
    prompt: Black's bishop on d4 is guarded only by the knight. Win the bishop.
    position: 4k3/pp3ppp/2n5/1B6/3b4/8/PP3PPP/3R2K1 w - - 0 1
    answers: [d1d4, b5c6]
    hint: Does the knight really guard d4?
    explanation: The knight is pinned, so it cannot take back on d4. A pinned piece guards nothing. Taking on c6 first, then on d4, also wins the bishop.
---

A pinned piece cannot move without losing something bigger. Pin your opponent's pieces, attack them, and step your own out of pins in time.

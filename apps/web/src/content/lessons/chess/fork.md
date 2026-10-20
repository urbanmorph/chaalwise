---
title: The fork
summary: Attack two pieces with one move, so only one of them can be saved.
game: chess
stage: 4
order: 1
skills: [calculate]
measures: patterns
steps:
  - kind: read
    id: what-a-fork-is
    text: A fork is one piece attacking two at once. Your opponent can save only one of them. A fork is strongest when one of the two is the king, because the check must be answered first. Here the knight can jump to c7 and attack the king and the rook together.
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1
    highlight: [c7]
  - kind: move
    id: knight-fork
    prompt: Fork the king and the queen.
    position: 6k1/5ppp/2q5/3N4/8/8/5PPP/6K1 w - - 0 1
    answers: [d5e7]
    hint: Find the square where your knight checks the king on g8 and also hits c6.
    explanation: Knight to e7 checks the king and attacks the queen. The king has to move, and the knight takes the queen.
  - kind: move
    id: pawn-fork
    prompt: Even a pawn can fork. Win a piece.
    position: 6k1/5ppp/2n1b3/8/3PP3/8/5PPP/6K1 w - - 0 1
    answers: [d4d5]
    hint: A pawn attacks the two squares diagonally in front of it.
    explanation: The pawn on d5 attacks the knight and the bishop. If the bishop takes it, the e-pawn takes back, and you still win a piece for a pawn.
  - kind: move
    id: queen-fork
    prompt: Black's bishop on h4 is loose. Win it with a check.
    position: 4k3/5ppp/8/8/7b/8/5PPP/3Q2K1 w - - 0 1
    answers: [d1a4]
    hint: Look for a queen check that also looks along the fourth rank.
    explanation: Queen to a4 checks along the diagonal and attacks the bishop along the rank. Black answers the check, and the queen takes the bishop.
  - kind: choice
    id: stop-the-fork
    prompt: Black to move. White threatens Nc7+, forking the king and the rook. Which move stops it?
    position: r3k3/5ppp/8/3N4/8/8/5PPP/6K1 b - - 0 1
    options:
      - ...Rc8, guarding c7
      - ...Kd7, guarding c7
      - ...Ra6, moving the rook
      - ...h6, giving the king room
    answer: 0
    feedback:
      - ''
      - 'The king does guard c7, but now Nb6+ forks the king on d7 and the rook on a8.'
      - 'The rook is still on a knight square. Nc7+ forks the king and the rook on a6.'
      - 'The king gains a square, but Nc7+ still checks and the rook on a8 falls.'
    explanation: With the rook on c8, Nc7+ is met by Rxc7. Before every move, look for the squares where your opponent's knight could fork.
    highlight: [c7]
---

A fork makes two threats with one move. Learn to see the squares where it lands, for you and for your opponent.

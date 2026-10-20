---
title: Checks, captures and threats
summary: The blunder check, for both sides, before every move.
game: chess
stage: 1
order: 4
skills: [think-ahead]
measures: safety
steps:
  - kind: read
    id: the-habit
    text: Before every move, look at checks, captures and threats. First theirs, asking what their last move does, then yours.
  - kind: choice
    id: last-move
    measures: anticipation
    prompt: Black's knight has just landed on c3. What does it attack?
    position: 4k3/8/8/8/8/2n5/8/3QK3 w - - 0 1
    options:
      - Your queen on d1
      - Your king on e1
      - Nothing, it is too far away
    answer: 0
    feedback:
      - ''
      - 'It lands next to your king, but a knight jumps in an L. From c3 it reaches d1 and e2, not e1.'
      - 'A knight attacks from a distance by jumping. Trace its L from c3 and it lands on d1.'
    explanation: The knight on c3 attacks d1, where your queen stands. Spotting that is half the blunder check.
    arrows: [c3d1]
  - kind: move
    id: take-the-attacker
    prompt: The knight attacks your queen. Deal with it in the best way.
    position: 4k3/8/8/8/8/2n5/3P4/3QK3 w - - 0 1
    answers: [d2c3]
    hint: Can something cheap take the knight?
    explanation: Your pawn takes the knight for free. When something attacks you, look for a way to take it before you run.
  - kind: move
    id: checks-first
    measures: patterns
    prompt: Look at your checks first. Find the move that wins.
    position: 6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    answers: [d1d8]
    hint: The black king is boxed in by its own pawns.
    explanation: Rd8 is checkmate. Checks come first in the blunder check because they can end the game.
  - kind: choice
    id: first-question
    prompt: Your opponent has just moved. What do you ask first?
    options:
      - What does their move attack, and what did it stop guarding?
      - Which of my own pieces can I develop next?
      - Can I attack something of theirs right away?
      - What was my plan, and how do I carry it on?
    answer: 0
    feedback:
      - ''
      - 'Development matters, but only once you know your pieces are safe. Their move may have made a threat.'
      - 'Your chances come second. If their move threatens something, an attack of yours may come too late.'
      - 'A plan is no use if their last move wins a piece or threatens mate. Look at their move first.'
    explanation: Their last move is where the danger comes from. Ask what it attacks and what it no longer protects.
---

Most games are lost to a check, a capture or a threat that was there to be seen. This lesson makes the habit automatic.

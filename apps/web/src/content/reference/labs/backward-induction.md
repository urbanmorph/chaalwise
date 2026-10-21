---
term: 'Backward induction'
game: 'labs'
kind: 'concept'
skill: 'calculate'
level: 'beginner'
aliases: ['Working backwards', 'Reasoning backwards']
summary: 'Solve the last decision first, then the one before it, until you reach the move you have to make now.'
related: ['strategy/count-it-through', 'labs/nash-equilibrium', 'labs/prisoners-dilemma']
try:
  - labs/backward-induction/nim-eleven
  - labs/backward-induction/deadline
  - labs/backward-induction/limits
---

Start at the end of the game and ask who wins there, then step back one move at a time. In Nim, here in its simplest one-pile form (take 1, 2 or 3 counters a turn, and whoever takes the last wins), with 0 counters left, the player who just moved has won. So a player facing 1, 2 or 3 wins by taking them all, and a player facing 4 loses, since any take leaves 1 to 3. Facing 5, 6 or 7, you win by leaving 4, and so on: every multiple of 4 is a loss for the player to move. The first move follows from the last.

Game theorists use the same method to solve any game where moves come in turn and the end is known: solve the last decision, assume each player will choose well there, and work back to the first. Counting a chess exchange through to its end is backward induction on the board.

In work, find the end state you need, then the step just before it, and the one before that, until you reach today. The first step is often not the obvious one.

It has limits. It needs a known end and players who look as far ahead as you do. Where the end is uncertain, or people do not reason that far, plan in stages and look again as you learn.

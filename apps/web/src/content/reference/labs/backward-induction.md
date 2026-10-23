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

Start at the end of the game and ask who wins there, then step back one move at a time. Take Nim, a counting game, in its simplest form. There is one pile of counters. Players take turns to remove 1, 2 or 3, and whoever takes the last counter wins. With 0 counters left, the player who just moved has won. So a player facing 1, 2 or 3 counters wins by taking them all. A player facing 4 loses, since any take leaves 1 to 3 for the other player. Facing 5, 6 or 7, you win by leaving 4. And so on: a pile of 4, 8, 12 or any multiple of 4 is a loss for the player about to move. The first move follows from the last.

Game theorists use the same method for any game where players take turns and the end is known. Solve the last decision, assume each player will choose well there, and work back to the first. In chess, counting a series of captures through to its end is backward induction on the board.

In work, find the end state you need, then the step just before it, and the one before that, until you reach today. The first step is often not the obvious one.

It has limits. It needs a known end and players who look as far ahead as you do. Where the end is uncertain, or people do not reason that far, plan in stages and look again as you learn.

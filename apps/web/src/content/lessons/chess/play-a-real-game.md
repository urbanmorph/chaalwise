---
title: Play a real game
summary: The rules and manners you need for a full game over the board or online.
game: chess
stage: 3
order: 9
skills: [composure]
measures: board
steps:
  - kind: read
    id: touch-move
    text: 'Over the board, touch-move applies. If you touch one of your pieces, you must move it, if it has a legal move. If you touch an enemy piece, you must take it, if you can. To straighten a piece without moving it, say "I adjust" first. To castle, touch the king first and move it two squares, then move the rook with the same hand.'
  - kind: choice
    id: touched-knight
    prompt: Over the board, you pick up your knight, then see that every knight move is bad. What now?
    options:
      - You must move the knight somewhere
      - Put it back, as you have not let go
      - Say "I adjust" and move something else
    answer: 0
    feedback:
      - ''
      - 'Letting go only fixes where the piece lands. Which piece you move was fixed when you touched it.'
      - '"I adjust" must be said before you touch the piece, not after.'
    explanation: Touching your piece commits you to moving it, if it has a legal move. Decide before your hand moves.
  - kind: choice
    id: how-to-castle
    prompt: Over the board, you want to castle. How do you do it?
    options:
      - Touch the king first, move it two squares, then the rook
      - Touch the rook first, then jump the king over it
      - Move the king and the rook at once, one in each hand
    answer: 0
    feedback:
      - ''
      - 'If you touch the rook first, you must move the rook, and you may not castle with it.'
      - 'Every move is made with one hand, and castling counts as a king move.'
    explanation: Castling is a king move, so the king goes first, two squares, then the rook hops over it.
  - kind: read
    id: clock-and-manners
    text: 'Most games use a clock. Each player has their own time, which runs only on their turn. Make your move, then press the clock with the same hand. If your time runs out, you lose, unless your opponent could not possibly mate you; then it is a draw. To offer a draw, make your move, say "draw?", then press the clock. To resign, say "I resign" and offer your hand. In clubs you write every move on a score sheet, in the notation you learned. Shake hands before and after, and do not talk during play.'
  - kind: choice
    id: flag-fall
    prompt: Your clock runs out. Your opponent has only a king left. What is the result?
    options:
      - A draw, as a lone king cannot mate
      - A loss, as running out of time always loses
      - A win, as you have more pieces
    answer: 0
    feedback:
      - ''
      - 'Usually it does, but not when your opponent could never mate you. A lone king cannot.'
      - 'Material does not decide the game. Running out of time never wins.'
    explanation: Running out of time loses, unless the opponent has no way at all to give mate. Then the game is drawn.
  - kind: choice
    id: online-repetition
    prompt: Online, the same position comes up for the third time. What happens?
    options:
      - It is a draw, and the site handles it
      - You must find an arbiter to claim it
      - Nothing; play goes on until mate
    answer: 0
    feedback:
      - ''
      - 'Over the board you claim it from the arbiter. Online there is none: the site draws the game, or gives you a button to claim it.'
      - 'Threefold repetition is a draw by the rules, online and over the board.'
    explanation: 'Online, the site either draws the game itself or gives you a button to claim the draw. Over the board, you claim it.'
  - kind: read
    id: go-and-play
    text: 'Online, choose a time control of 10 minutes or more per side while you learn, so you have time to think. To castle, drag the king two squares. You know enough to play a full game. Play one this week, offline or online, then come back to learn more.'
---

A full game needs a few rules that the board does not show: touch-move, the clock, draws and resigning, and how to behave. Learn them here, then go and play: [where to play, free](/play-elsewhere/).

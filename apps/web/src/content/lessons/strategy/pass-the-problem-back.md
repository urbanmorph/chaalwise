---
title: Pass the problem back
summary: Some positions are bad for whoever must move next. When you can, make the move that leaves the hard choice with the other side.
game: strategy
stage: 6
order: 2
skills: [think-ahead]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, kings cannot stand next to each other. When they face each other with one square between, the one that must move has to give way. Here Black is to move. Black's king must step aside, White's king walks forward, and the pawn queens. With White to move instead, it would be a draw. This is the opposition.
    position: 8/4k3/8/4K3/4P3/8/8/8 b - - 0 1
    highlight: [e5, e7]
  - kind: move
    id: hand-it-back
    prompt: White to move. Only one move wins, the one that leaves Black to choose. Find it.
    position: 8/8/4k3/8/3K4/4P3/8/8 w - - 0 1
    measures: endgame
    answers: [d4e4]
    hint: Put your king face to face with Black's, with one square between.
    explanation: Ke4 faces Black's king with one square between, and leaves Black to move. Black must give way, White's king steps forward, and the pawn follows. Every other move, even e4, lets Black take the opposition, and it is a draw.
  - kind: read
    id: off-the-board
    text: Off the board, some choices are hard for whoever has to make them. When a choice belongs to someone else, do not quietly take it on yourself. Make the move that hands it back, clearly and fairly, so the person who owns it has to make it.
  - kind: choice
    id: fourth-project
    prompt: You already have three projects due this month. Your manager asks you to fit in a fourth as well. What do you reply?
    options:
      - Ask which of the three should move to make room
      - Say yes, and work the weekends to fit it in
      - Say no, as you are already fully booked
    answer: 0
    feedback:
      - ''
      - Saying yes feels helpful, but it makes the trade-off yours alone. Your weekends pay for a choice your manager should have made.
      - No is honest, but it ends the talk and makes you the obstacle. The real question, which work matters most, is left unasked.
    explanation: Which project matters most is your manager's choice. Asking which one moves hands that choice back, where it belongs, instead of fitting four projects' work into the time for three.
  - kind: choice
    id: group-split
    prompt: In a group project, a teammate asks you to split the work, then objects to each split you suggest. The deadline is in ten days. What do you do next?
    options:
      - Offer two fair splits and ask them to choose one
      - Take on their part yourself to end the argument
      - Keep suggesting new splits until one is accepted
    answer: 0
    feedback:
      - ''
      - It ends the argument, but you carry twice the work, and next time the same thing will happen.
      - Each new split leaves the hard choice with you, and costs days. Ten days do not allow many rounds.
    explanation: While you keep proposing, they keep the easy part, which is objecting. Two fair options hand the choice to them. Now they must decide, as the king that has to move must give way.
  - kind: choice
    id: compare
    prompt: Black, to move, must give way. What does that share with the engineer's reply?
    position: 8/4k3/8/4K3/4P3/8/8/8 b - - 0 1
    alongside: An engineer is asked to fit a fourth project into a month already full with three.
    options:
      - Leave the hard choice with the side that must make it
      - Both are about facing the other side head on
      - Both are won by moving first, before the other side
    answer: 0
    feedback:
      - ''
      - The kings do face each other, but that is the surface. What decides it is who has to make the next choice.
      - Having to move is what loses here. Black must move, and that is Black's problem. Handing back the choice is what wins.
    explanation: Black's king must give way because it is Black's move. The engineer hands back the choice of which project moves, so the person who owns it has to make it.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you pass the problem back?'
    situations:
      - 'someone hands me a choice that is really theirs'
      - 'I am asked to take on more than the time allows'
      - 'a group cannot agree and waits for me to give way'
    action: 'I will set out the real options and ask them to choose'
---

Opposition and zugzwang are where chess makes this idea exact. Off the board, it becomes a habit only if you practise it there too, as this week's task asks.

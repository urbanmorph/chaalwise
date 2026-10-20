---
title: Spend effort where it matters
summary: Time and attention are limited. Decide small choices you can undo quickly, and spend your effort on the few that are large and final.
game: strategy
stage: 7
order: 4
skills: [composure]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, your clock runs only on your turn, and every minute spent now is gone for later. Strong players move quickly when the move is obvious, such as a forced recapture, and slow down when a move cannot be undone. Here Rxd8 Kxd8 would leave only kings and pawns. Once the rooks are off, they never come back, so that is the moment to think.
    position: 3r4/4kppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    highlight: [d1, d8]
  - kind: move
    id: slow-down
    prompt: A moment to slow down. One move here changes the game for good, and only one wins. Find it.
    position: 3r4/4k3/8/4K3/4P3/8/8/3R4 w - - 0 1
    measures: calculation
    answers: [d1d8]
    hint: 'Count it through: what is left after the rooks come off?'
    explanation: Rxd8 Kxd8 leaves a pawn ending, and White wins it. The king steps to d6 or e6, on the sixth rank ahead of its pawn. With the rooks still on, Black can defend, and every other move only draws or worse.
  - kind: read
    id: off-the-board
    text: Off the board, attention is your clock. Most choices are small, or easy to undo, so make them quickly. Save your time for the few that are large and hard to reverse. Giving the same care to everything leaves too little for what matters.
  - kind: choice
    id: lease
    prompt: This week you must choose a booking tool for meeting rooms, which can be cancelled any month, and sign a five-year office lease. You have about ten hours for both. How do you split them?
    options:
      - An hour on the tool, the rest on the lease
      - Five hours each, so neither is rushed
      - The tool first, as the team uses it every day
    answer: 0
    feedback:
      - ''
      - Equal time feels fair, but the two are not equal. A poor tool costs a month; a poor lease costs five years.
      - Daily use makes the tool feel important, but it can be dropped next month. The lease cannot.
    explanation: Ask what each mistake would cost and whether it can be undone. The tool can be changed in a month; the lease binds you for sixty. Give the time to the lease.
  - kind: choice
    id: stuck-question
    prompt: In a two-hour exam, you have spent 20 minutes on a 2-mark question you cannot crack. There are 60 marks still to answer. What now?
    options:
      - Leave it, do the rest, and come back if time allows
      - Keep at it, since you have already put in 20 minutes
      - Rush the rest at speed to win back the lost time
    answer: 0
    feedback:
      - ''
      - The 20 minutes are gone whatever you do. Another 20 on 2 marks is time taken from 60.
      - The lost time is real, but rushing spreads mistakes over the 60 marks that matter most.
    explanation: Two marks against sixty means the time belongs to the sixty. Moving on is not giving up. It is spending effort where it earns most, then coming back if there is time.
  - kind: choice
    id: compare
    prompt: Trading rooks here cannot be undone. What does that moment share with the lease?
    position: 3r4/4kppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
    alongside: A manager has a week to choose a five-year lease and a monthly software plan.
    options:
      - Most time on the choice that cannot be undone
      - Both are about trading one thing for another
      - Every step deserves the same careful thought
    answer: 0
    feedback:
      - ''
      - A trade of rooks and a signed lease both sound like trades, but that is the surface. What matters is that neither can be taken back.
      - Equal care leaves too little time for the moves that cannot be undone. On the clock, that costs games.
    explanation: A recapture or a monthly plan can be decided fast, because a mistake is cheap or can be reversed. The rook trade and the lease are final, so they get the time.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you spend your effort where it matters?'
    situations:
      - 'I face a choice that will be hard to undo'
      - 'I notice I have spent a long time on a small choice'
      - 'I plan my time for an exam, a deadline or a busy week'
    action: 'I will ask how hard it is to undo, and give it time to match'
---

The clock makes this plain in chess, where every minute is counted. Off the board, sharing out your effort well becomes a habit only if you practise it there, as this week's task asks.

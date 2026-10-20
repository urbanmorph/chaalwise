---
title: Their next move
summary: Think through how the other side will respond, as they see it, not as you hope.
game: strategy
stage: 1
order: 2
skills: [think-ahead]
after: chess/blunder-check
steps:
  - kind: read
    id: on-the-board
    text: On the board, when you consider a move you ask, if I play this, what will they play? Their best reply, not the one you hope for. Here, if Black plays ...g6 to chase the queen, the queen simply takes on e5 with check.
    position: 'moves: e4 e5 Qh5'
    highlight: [h5, e5]
  - kind: read
    id: off-the-board
    text: Off the board, before you act, think through how the other side will respond. Picture their best reply from where they stand, then decide.
  - kind: choice
    id: ask-for-a-raise
    prompt: You plan to ask for a raise next week. Last week you missed an important deadline. How do you prepare?
    options:
      - List your best results of the year to make the case
      - Expect the deadline to come up, and prepare your answer
      - Ask at once, before the deadline counts against you
    answer: 1
    feedback:
      - Your results are your strongest move, but they are your move. Their best reply is the deadline, and an unprepared answer to it undoes the list.
      - ''
      - Moving fast feels like getting ahead of it, but the deadline is freshest now. Their reply will be the same, only sooner.
    explanation: Their best reply uses your weakest point. Prepare for it, or choose a better moment.
  - kind: choice
    id: price-cut
    prompt: You and the stall across the road each sell 100 cups of tea a day at 20 a cup. You cut to 18 to win their customers. If they cut to 18 the next day, and each stall keeps its 100 cups, what has your cut done to your daily takings?
    options:
      - Raised them, from the customers you win
      - Left them the same, since you both cut
      - Lowered them by 200, and theirs too
    answer: 2
    feedback:
      - You would win customers if they did nothing, but that is the reply you hope for. Once they match, nobody has a reason to switch.
      - Your share of customers is the same, but each cup now earns 2 less, so the same 100 cups bring in less.
      - ''
    explanation: 100 cups at 18 is 1,800 instead of 2,000. If their best reply cancels your move, your move only costs you. Think one reply ahead before you commit.
  - kind: read
    id: try-it
    text: Try it this week. Before a conversation that matters, write down the other person's best reply, and how you would answer it.
---

Chess players call it anticipation. In daily life it is just thinking one step ahead of the other person.

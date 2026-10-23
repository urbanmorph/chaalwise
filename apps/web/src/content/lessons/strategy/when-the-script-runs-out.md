---
title: When the script runs out
summary: Prepared plans run out. When they do, act on the reasons behind them.
game: strategy
stage: 3
order: 2
skills: [plan-long]
after: chess/opening-map
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, players learn opening lines by heart, and opponents often leave them early. Here Black answers 1.e4 with ...a6, a move few players prepare for. The memorised lines are no help now. The reasons behind them still are. Take the centre, bring out the pieces, castle.
    position: 'moves: e4 a6'
    highlight: [a6]
  - ask: chess/when-the-script-runs-out/reasons-not-lines
  - kind: read
    id: off-the-board
    text: Off the board, scripts are prepared lines. A sales pitch, a model answer, the way it was done last time. They work while things go as expected. When the other side does something new, do not force the script. Ask what it was for, and act on that reason.
  - ask: life/when-the-script-runs-out/pitch
  - ask: life/when-the-script-runs-out/exam-question
  - ask: chess/when-the-script-runs-out/compare
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you go back to the reason?'
    situations:
      - 'a meeting or call leaves my prepared plan'
      - 'a question is worded in a way I have not seen'
      - 'a routine I follow stops working'
    action: 'I will ask what the plan was for, and act on that reason'
---

Opening principles are what is left when the memorised moves run out. Off the board, going back to the reason becomes a habit only if you practise it there too, as this week's task asks.

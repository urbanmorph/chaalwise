---
title: Estimate it
summary: Start from how similar cases usually turn out, break the number into parts you can count, then adjust.
game: strategy
stage: 6
order: 4
skills: [weigh-odds]
after: chess/endgame-intro
sources:
  - title: 'Daniel Kahneman and Amos Tversky, Intuitive prediction: biases and corrective procedures (1979)'
    licence: cited-idea
  - title: "Dan Lovallo and Daniel Kahneman, Delusions of success: how optimism undermines executives' decisions (2003)"
    licence: cited-idea
  - title: 'Philip Tetlock and Dan Gardner, Superforecasting: the art and science of prediction (2015)'
    licence: cited-idea
steps:
  - kind: read
    id: on-the-board
    text: On the chessboard, a race between a pawn and a king is hard to judge by eye, but easy in parts. White's b-pawn needs four moves to reach b8 and become a queen. Black's king, on g5, needs four moves to reach c7, the square next to b8. White moves first, so when the pawn reaches b8 the king has made only three moves. It is one square short, and the new queen is safe.
    position: 8/8/8/6k1/1P6/8/7K/8 w - - 0 1
    highlight: [b8, c7]
    arrows: [b4b8, g5c7]
  - ask: chess/estimate-it/one-square-closer
  - ask: chess/estimate-it/compare
  - kind: read
    id: off-the-board
    text: 'What both share has a name: estimate it. First ask how similar cases usually turn out, which is called the outside view. Then break the number into parts you can guess, a Fermi estimate, named after the physicist Enrico Fermi. Last, adjust for what is really different this time. People planning their own work skip the first step, so most plans run late: the planning fallacy.'
  - ask: life/estimate-it/tea-stall
  - ask: life/estimate-it/revision-hours
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you estimate a number in parts?'
    situations:
      - 'someone asks me how long something will take'
      - 'I plan my revision or my week'
      - 'I need a number that nobody can give me'
    action: 'I will start from how similar cases went, then count the parts and adjust'
---

Endgames are won by counting moves, not by feel. Off the board, estimating in parts becomes a habit only if you practise it there, as this week's task asks. The reference entry [Start from the base rate](/reference/strategy/base-rates/) explains the outside view, and the Which bag? lab lets you practise it.

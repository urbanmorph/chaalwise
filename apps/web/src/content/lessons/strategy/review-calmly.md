---
title: 'Review calmly: decisions, not results'
summary: Judge a choice by what you knew, and could have found out, when you made it, not only by how it turned out.
game: strategy
stage: 7
order: 7
skills: [composure]
after: chess/endgame-intro
steps:
  - kind: read
    id: on-the-board
    text: On the board, a result can hide its mistakes. Here Black has just played Nf6, and Qxf7 is mate. Suppose White missed it, and Black went on to win. Judged by the result, Nf6 was fine. Judged by what Black could see when playing it, it was a blunder.
    position: 'moves: e4 e5 Qh5 Nc6 Bc4 Nf6'
    highlight: [c4, f7, h5]
  - kind: move
    id: missed-mate
    prompt: You won this game forty moves later. In review, you find that you missed a mate in one here. Find it.
    position: 6k1/5p1p/6p1/8/8/8/1B3PPP/3R2K1 w - - 0 1
    measures: patterns
    answers: [d1d8]
    hint: Which square next to Black's king does the bishop already cover?
    explanation: Rd8 is mate. The rook covers the back rank, and the bishop covers g7. The win hid the miss, which is why you review the moves, not the result.
  - kind: read
    id: off-the-board
    text: Off the board, it is tempting to judge a choice by how it turned out, so a win means it was good and a loss means it was bad. But luck plays a part. Review calmly. What did you know, what could you reasonably have found out, and was the choice sound given that? Then ask whether the result shows something you missed.
  - kind: choice
    id: launch
    prompt: Your team launched a product after testing it with 200 customers, 80% of whom liked it. A month later, a supplier failure delayed every order, and sales were poor. In the review, what do you ask first?
    options:
      - Was the launch sound on what we knew, and could know?
      - Who approved the launch, given that it failed?
      - Should we stop launching without a bigger test?
    answer: 0
    feedback:
      - ''
      - Looking for someone to blame judges the decision by its result. The failure came from a supplier, not from the call to launch.
      - A bigger test would not have caught a supplier failure. Changing the rule because of this result learns the wrong lesson.
    explanation: 160 of 200 liking it was good evidence. Ask whether the supplier risk was known, or could have been checked. If it could, that is the lesson. If not, the decision was sound and the result was bad luck.
  - kind: choice
    id: surprise-chapter
    prompt: You followed a good revision plan for a test but scored 55, because it covered a chapter the teacher had said would not be on it. What do you change for next time?
    options:
      - Keep the plan, but check what the test covers in writing
      - Study twice as long, since the plan clearly failed
      - Revise less, as the result came down to luck anyway
    answer: 0
    feedback:
      - ''
      - The study was not the problem; the missing chapter was. Twice the hours on the wrong chapters would give the same result.
      - Luck played a part, but one piece was within reach, checking what the test covers. Revising less adds nothing.
    explanation: Sort luck from judgement. The plan was sound, and the surprise chapter was bad luck, but what the test covered could have been checked. Keep what was sound, and fix what was in reach.
  - kind: choice
    id: compare
    prompt: Nf6 allowed mate, yet Black might still win. What does judging that move share with the launch review?
    position: 'moves: e4 e5 Qh5 Nc6 Bc4 Nf6'
    alongside: A team reviews a product launch that went badly after a supplier failed.
    options:
      - Judge the choice by what was known, not the result
      - Both are about an attack that came from outside
      - Both are judged best by how things turned out
    answer: 0
    feedback:
      - ''
      - The queen and the supplier both strike from outside, but that is the surface. What they share is how to judge the choice.
      - That is outcome bias. A lucky win does not make Nf6 good, and a bad result does not make the launch a bad decision.
    explanation: Nf6 was a mistake when it was played, whatever happened next. The launch may have been sound when it was made. In both, judge the choice by what was known and could have been found out.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you review a decision calmly?'
    situations:
      - 'something I decided turns out badly'
      - 'something turns out well, partly by luck'
      - 'I get back a test, an appraisal or a result'
    action: 'I will ask what I knew, what I could have found out, and whether the choice was sound'
---

Chess players review their games move by move, win or lose. Off the board, judging decisions apart from results becomes a habit only if you practise it there, as this week's task asks.

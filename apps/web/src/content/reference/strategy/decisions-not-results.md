---
term: 'Judge decisions, not results'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Resulting', 'Outcome bias', 'Process over outcome']
summary: 'A good decision can turn out badly, and a bad one can get lucky. Judge by what you knew, and what you could reasonably have found out, when you decided.'
why: 'If you learn from results alone, luck teaches you the wrong lessons.'
inLife: 'Review a plan by asking whether it was sensible with what you knew, and could have found out, not only whether it worked.'
skill: 'composure'
lesson: 'strategy/review-calmly'
related: ['poker/expected-value', 'poker/tilt', 'strategy/sunk-cost']
try:
  - kind: choice
    id: good-chance
    prompt: 'You took a chance you judged would work four times in five, and it failed. What should you do next time?'
    options:
      [
        'Avoid that kind of chance: the failure shows it was too risky',
        'Take it again without a second thought: the decision was good',
        'Check whether the failure showed your four in five was wrong',
      ]
    answer: 2
    feedback:
      - 'A failure hurts, so it feels like proof. But a four-in-five chance still fails one time in five; one result cannot tell you much.'
      - 'This is half right: one failure does not make the decision bad. But a result is evidence too, and it may show something your estimate missed.'
      - ''
    explanation: 'One bad result does not make a good decision bad: four in five still fails one time in five. But look at why it failed. If nothing you missed would have changed the estimate, take it again.'
  - kind: choice
    id: lucky-win
    prompt: 'A friend left a piece hanging, the opponent missed it, and the friend won. Was it a good move?'
    options:
      [
        'Yes: it won the game',
        'No: it was a mistake that got lucky',
        'Yes, if the friend guessed the opponent would miss it',
      ]
    answer: 1
    feedback:
      - 'The win is real, but it came from the opponent missing the piece, not from the move. Next time the piece is taken.'
      - ''
      - 'Reading an opponent can matter, but hoping they miss a free piece is a gamble with nothing to gain. A safe move would have kept the same chances.'
    explanation: "Judge the move by what was known when it was played. It gave away a piece; the win came from the opponent's mistake."
---

Psychologists call the mistake outcome bias: judging a decision by how it turned out. Poker makes this vivid: the right call loses some of the time. Chess has it too: a sound move can lose to an opponent who found something rare.

Results still carry information. The task is to sort luck from judgement: ask what you knew, what you could have found out, and whether the result shows your estimate was wrong.

---
term: 'Judge decisions, not results'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Resulting', 'Process over outcome']
summary: 'A good decision can turn out badly, and a bad one can get lucky. Judge by what you knew when you decided.'
why: 'If you learn from results alone, luck teaches you the wrong lessons.'
inLife: 'Review a plan by asking whether it was sensible with what you knew, not only whether it worked.'
skill: 'composure'
related: ['poker/expected-value', 'poker/tilt', 'strategy/sunk-cost']
try:
  - kind: choice
    id: good-chance
    prompt: 'You took a chance that works four times in five, and it failed. What should you do next time?'
    options:
      ['Avoid that kind of chance', 'Take it again: the decision was good', 'Take a bigger risk to make up for it']
    answer: 1
    explanation: 'One bad result does not make a good decision bad. Four in five still wins most of the time.'
  - kind: choice
    id: lucky-win
    prompt: 'A friend left a piece hanging, the opponent missed it, and the friend won. Was it a good move?'
    options: ['Yes, it won the game', 'No: it was a mistake that got lucky']
    answer: 1
    explanation: "Judge the move by what was known when it was played. It gave away a piece; the win came from the opponent's mistake."
---

Poker makes this vivid: the right call loses some of the time. Chess has it too: a sound move can lose to an opponent who found something rare.

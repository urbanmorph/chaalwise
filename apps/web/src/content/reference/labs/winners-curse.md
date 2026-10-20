---
term: "Winner's curse"
game: 'labs'
kind: 'concept'
skill: 'value'
level: 'intermediate'
summary: 'In an auction for something of uncertain value, the winner tends to be the one who overestimated it most.'
related: ['strategy/winners-curse', 'poker/expected-value']
try:
  - kind: choice
    id: who-wins
    prompt: 'Five bidders estimate a jar of coins that is worth the same to all of them. Each estimate is off by up to 30 points. If everyone bids their estimate, who usually wins?'
    options:
      ['The one whose estimate was nearest', 'The one who overestimated most', 'Anyone at all: it is down to luck']
    answer: 1
    feedback:
      - 'Being right feels like it should win, but the highest bid wins, and the highest estimate is usually the biggest overestimate.'
      - ''
      - 'Luck decides whose error is biggest, but not that the winner holds the biggest overestimate. That part is built in.'
    explanation: 'The highest of several guesses at the same value is most likely too high. Winning tells you that you were the most optimistic.'
  - kind: choice
    id: more-bidders
    prompt: 'Next time there are ten bidders instead of five, with the same kind of jar. How should you change your bid?'
    options:
      [
        'Shade it further below your estimate',
        'Shade it less, to have a chance of winning',
        'Keep the same margin: your estimate is the same',
      ]
    answer: 0
    feedback:
      - ''
      - 'More rivals feels like a reason to sharpen your price, and real bidders often do. But the more bidders, the further the winning estimate is above the truth.'
      - 'Your estimate is the same, but what winning tells you is not: against more bidders, winning means you were even more optimistic.'
    explanation: 'The more bidders, the bigger the overestimate behind the winning bid, so the more you shade.'
  - kind: choice
    id: personal
    prompt: "You bid for your grandmother's old painting, worth far more to you than to anyone else. Does the winner's curse apply?"
    options:
      [
        'No: its worth to you is not a guess at a shared value',
        'Yes: every auction winner has overestimated',
        'Yes, but only if many people bid',
      ]
    answer: 0
    feedback:
      - ''
      - 'The curse comes from a value that is the same for everyone but unknown. Here the value is yours, and winning tells you nothing new about it.'
      - 'More bidders deepen the curse only when all of them are guessing the same unknown value. Here what it is worth to them and to you differ.'
    explanation: 'With a value that is personal to you, winning is no curse: set your limit from what it is worth to you, and keep to it.'
---

If the item is worth about the same to every bidder, and everyone estimates that value with some error, the highest bid comes from the biggest overestimate. Bid below your estimate, by more when there are more bidders and more uncertainty.

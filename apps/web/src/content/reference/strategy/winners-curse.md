---
term: "Don't overpay to win"
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ["Winner's curse", 'Value and bid']
summary: 'When many people bid on something uncertain, the winner is often the one who overestimated it.'
why: 'Winning an auction is good news about the item and bad news about your estimate.'
inLife: 'Bidding wars for houses, players or companies: decide your limit before the bidding starts, and keep to it.'
skill: 'value'
related: ['labs/winners-curse', 'poker/expected-value']
try:
  - kind: choice
    id: who-wins
    prompt: 'Ten firms bid for a contract whose real cost nobody knows. Your estimate was the lowest, so you won. What is most likely?'
    options: ['You priced it best', 'You underestimated the cost the most']
    answer: 1
    explanation: 'When everyone guesses, the lowest guess wins, and the lowest guess is most likely too low.'
  - kind: choice
    id: how-to-bid
    prompt: 'So how should you bid next time?'
    options:
      [
        'Bid your estimate exactly',
        'Allow for your guess being wrong, and bid more carefully the more bidders there are',
        'Bid lower to be sure of winning',
      ]
    answer: 1
    explanation: 'Winning means you were the most optimistic. Build that in: the more bidders, the more careful the bid.'
---

Set your price from what the thing is worth to you, then shade it down for the fact that winning means you were the most optimistic.

---
term: "Don't overpay to win"
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ["Winner's curse", 'Value and bid']
summary: 'When many people bid on something uncertain, the winner is often the one who overestimated it.'
why: 'Winning an auction is good news about the item and bad news about your estimate.'
inLife: 'Bidding wars for companies, drilling rights or building contracts, where the prize is worth about the same to every bidder: decide your limit before the bidding starts, and keep to it.'
skill: 'value'
related: ['labs/winners-curse', 'poker/expected-value']
try:
  - kind: choice
    id: who-wins
    prompt: 'Ten firms bid for a building contract. The real cost will be the same whichever firm does the work, but nobody knows it yet. Your estimate was the lowest, so you won. What is most likely?'
    options: ['You priced it best', 'You underestimated the cost the most', 'The other firms padded their prices']
    answer: 1
    feedback:
      - 'Winning feels like being right. But the cost is the same for every firm, so the lowest price is not better pricing, only the lowest guess.'
      - ''
      - 'Some firms may add a margin, but ten estimates of the same cost spread around the truth. The lowest of them is most likely below it.'
    explanation: 'When everyone guesses the same unknown cost, the lowest guess wins, and the lowest guess is most likely too low.'
  - kind: choice
    id: how-to-bid
    prompt: 'So how should you bid next time?'
    options:
      [
        'Bid your estimate exactly: it is your best guess',
        'Add a margin for error, bigger the more bidders there are',
        'Keep a smaller margin when bidders are many, to stay in it',
      ]
    answer: 1
    feedback:
      - 'Your estimate is your best guess before the bidding. But winning tells you it was probably the lowest guess, and a guess that wins is a guess that was too low.'
      - ''
      - 'Tougher competition feels like a reason to sharpen your price, and real bidders often do this. But with more bidders, the winning guess is further from the truth, so you need more margin, not less.'
    explanation: 'Winning means you were the most optimistic. Build that in: the more bidders, the bigger the margin.'
---

Estimate what the thing is really worth. If it would be worth about the same to every bidder and nobody knows exactly, shade your bid: winning means you were the most optimistic.

If the value really is personal, as with a house you love for reasons no one else shares, there is no curse from winning; just keep to the price you set.

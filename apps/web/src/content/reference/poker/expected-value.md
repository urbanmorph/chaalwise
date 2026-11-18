---
term: 'Expected value'
title: 'Expected value (EV) in poker: how to work it out'
game: 'poker'
kind: 'odds'
level: 'intermediate'
aliases: ['EV']
summary: 'What a decision is worth on average, weighing each outcome by how likely it is.'
lesson: 'poker/expected-value'
try:
  - 'poker/expected-value/positive'
  - 'poker/expected-value/good-call-lost'
related: ['poker/pot-odds', 'strategy/decisions-not-results', 'strategy/winners-curse']
faq:
  - q: 'What is expected value in poker?'
    a: 'Expected value, or EV, is what a decision wins or loses on average, if you made it many times. A call with positive EV makes points over time, even though it loses some hands.'
  - q: 'How do you work out expected value?'
    a: 'Multiply each result by how likely it is, and add them up. A call of 10 that wins 40 a quarter of the time is worth 0.25 × 40 − 0.75 × 10 = 2.5 points, so it is worth making.'
  - q: 'How is expected value related to pot odds?'
    a: 'Pot odds give the break-even point, where the expected value is zero. Calling 10 to win 40 breaks even at 10 of 50, or 20%. Win more often than that and the call has positive EV.'
  - q: 'Can a good call lose?'
    a: 'Yes. A call with positive EV still loses whenever the card you need does not come. Judge it by its average over many hands, not by one result.'
---

Say a call (matching a bet to stay in the hand) costs 10 points. A quarter of the time the call wins, and you take 40 points from the pot. The rest of the time you lose the 10. Its expected value is 0.25 × 40 − 0.75 × 10 = 2.5 points. So the call is worth making, even though it loses most of the time.

This is the idea behind judging decisions rather than results.

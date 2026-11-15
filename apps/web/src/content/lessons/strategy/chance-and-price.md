---
title: Weigh the chance against the price
summary: Before you pay for a chance, compare how likely it is to pay off with what it costs.
game: strategy
stage: 2
order: 1
skills: [weigh-odds]
after: poker/outs-and-odds
sources:
  - title: Chaalwise, our own writing; the poker numbers are worked out by packages/poker
    licence: own
steps:
  - kind: read
    id: on-the-board
    text: 'In this poker hand, played for points, you hold two spades, and two of the four shared cards are spades. One more spade would make a flush (five cards of one suit), and one shared card is still to come. Nine spades are left among the 46 cards you cannot see, so the flush comes about one time in five. Your opponent has just bet. The pot (the points bet so far) now holds 30 points, and to call (match the bet and stay in) costs 10.'
    cards:
      hole: [As, 7s]
      board: [9s, 4s, Kd, 2c]
      pot: 30
      toCall: 10
  - ask: poker/chance-and-price/flush-draw
  - ask: poker/chance-and-price/compare
  - kind: read
    id: off-the-board
    text: 'What both share has a name: weigh the chance against the price. In poker, a call pays over many hands when your chance of winning is bigger than your share of the pot after you call. Away from the table, multiply the chance by what you would gain, and compare that with what it costs. A long shot can be worth it when it is cheap. A likely win can still cost too much.'
  - ask: life/chance-and-price/pitch
  - ask: life/chance-and-price/scholarship
  - ask: life/chance-and-price/flexible-ticket
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you weigh a chance against its price?'
    situations:
      - 'I am offered an extra, such as a warranty, cover or an upgrade'
      - 'I decide whether to apply, enter or pitch for something unlikely'
      - 'I am about to give up on something only because it will probably fail'
    action: 'I will put rough numbers on the chance, the prize and the price, and compare them'
---

Poker turns a chance and a price into numbers you can count. Away from the table the numbers are rougher, but the comparison is the same: how often it pays, how much it pays, and what it costs. The reference entries [Pot odds](/reference/poker/pot-odds/) and [Expected value](/reference/poker/expected-value/) go further.

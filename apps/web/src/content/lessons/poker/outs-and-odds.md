---
title: Outs and odds
summary: Count the cards that would win, turn them into a chance, and weigh it against the price of a call.
game: poker
stage: 2
order: 1
skills: [weigh-odds]
steps:
  - kind: read
    id: outs
    text: 'An out is an unseen card that would give you the winning hand. Here you hold two hearts and two more are on the board: a flush draw. Thirteen hearts are in the deck and four are in sight, so nine hearts are left: nine outs.'
    cards:
      hole: [Ah, 5h]
      board: [Kh, 9h, 2c]
  - kind: read
    id: rule-of-four
    text: 'A quick estimate: with two cards to come, your chance in percent is about four times your outs; with one card to come, about two times. Nine outs on the flop: about 36%. Nine outs on the turn: about 18%.'
  - ask: poker/outs-and-odds/open-ended
  - ask: poker/outs-and-odds/rule-of-four
  - ask: poker/outs-and-odds/pot-odds
  - ask: poker/outs-and-odds/fold-the-draw
  - ask: poker/outs-and-odds/call-the-draw
  - ask: life/price-and-chance/warranty
---

Weighing odds is comparing a chance with a price. Poker makes both into numbers you can count.

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
    text: 'Sometimes your hand is not made yet, but one more card could make it strong. Here you hold two hearts, and two of the three shared cards are hearts too. That is four hearts, so one more heart makes a flush (five cards of one suit). This is called a flush draw. An out is an unseen card that would give you the winning hand. The deck has 13 hearts and you can see 4, so 9 hearts are left: 9 outs.'
    cards:
      hole: [Ah, 5h]
      board: [Kh, 9h, 2c]
  - kind: read
    id: rule-of-four
    text: 'The shared cards come in three steps: three at once (the flop), then a fourth (the turn), then a fifth (the river). For a quick estimate of your chance in percent, multiply your outs by four on the flop, with two cards to come. On the turn, with one card to come, multiply by two. Nine outs on the flop: about 36%. Nine outs on the turn: about 18%.'
  - ask: poker/outs-and-odds/open-ended
  - ask: poker/outs-and-odds/rule-of-four
  - ask: poker/outs-and-odds/pot-odds
  - ask: poker/outs-and-odds/fold-the-draw
  - ask: poker/outs-and-odds/call-the-draw
  - ask: life/price-and-chance/warranty
---

Weighing odds is comparing a chance with a price. Poker makes both into numbers you can count.

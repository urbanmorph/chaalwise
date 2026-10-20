---
title: Lead or answer well
summary: Move first when your move commits you or anchors the other side; answer when their move tells you something. When you answer, choose on purpose, to level things or to change their shape.
game: strategy
stage: 3
order: 1
skills: [plan-long]
after: chess/opening-map
steps:
  - kind: read
    id: on-the-board
    text: On the board, White moves first and keeps a small edge, the initiative. Black chooses how to answer. Play solidly to level the game, then outplay; or unbalance it, as the Sicilian does here, and play for a win at more risk.
    position: 'moves: e4 c5'
    highlight: [c5]
  - kind: read
    id: off-the-board
    text: Off the board, someone always moves first, with the first offer or the first idea in a meeting. Moving first pays when your move commits you or anchors the other side, and you know what things are worth. Moving second pays when their move tells you something you lack. Ask which is true here. If you lead, keep the initiative. If you answer, choose on purpose. Make it level and solid, or change the shape of the problem.
  - kind: choice
    id: first-offer
    prompt: You are selling your bicycle. Ones like it sell for about 8,000. A buyer opens at 4,000. What do you say?
    options:
      - Counter at about 8,000, pointing to what similar ones sell for
      - Offer to meet in the middle at 6,000
      - Ask what is the most they could really pay
    answer: 0
    feedback:
      - ''
      - Meeting in the middle feels fair, but their low first number set the middle. Splitting the gap gives away 2,000 of a price you could justify.
      - Asking for more information is wise when you know little, but you already know the value. Their 4,000 stays the anchor, and you invite a second number from them.
    explanation: Their 4,000 is an anchor. A counter grounded in what similar bicycles fetch pulls the talk back towards level; splitting the difference lets their first number decide the middle.
  - kind: choice
    id: rival-shop
    prompt: A large chain opens next door to your small hardware shop. It sells the same items for 15% less, and it can afford low prices for longer than you can. What is your best answer?
    options:
      - Match its prices on the items people buy most
      - Offer what it does not, such as repairs and advice
      - Cut your prices below its prices for a while
    answer: 1
    feedback:
      - Matching keeps customers for now, but it plays the chain's game on its terms, where the bigger purse lasts longer.
      - ''
      - Undercutting is a bolder version of the same game. The chain can follow you down, and it can afford the losses for longer.
    explanation: A price fight is the chain's strongest ground. Changing what you compete on is the Sicilian answer, riskier but with more to win.
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you choose whether to lead or answer?'
    situations:
      - 'someone makes me an offer or a request'
      - "a meeting opens with someone else's plan"
      - 'a group project is shared out'
    action: 'I will decide, before I reply, whether to answer it as it is or change its shape'
---

Every opening is a first move and an answer. So are many of the situations you meet every day.

---
title: Keep them guessing
summary: When someone gains by predicting you, mix your choices at random so there is nothing to read. Where people rely on you, stay predictable.
game: strategy
stage: 7
order: 12
skills: [unpredictable]
after: labs/rock-paper-scissors
steps:
  - kind: read
    id: on-the-board
    text: 'In the Rock-paper-scissors lab, you make 30 throws against a bot. Rock beats scissors, scissors beats paper, and paper beats rock. The bot counts what you threw after each pair of throws, and plays what beats your likeliest next throw. With nothing to go on, it throws at random.'
  - ask: labs/mixed-strategy/rock-then-paper
  - ask: labs/mixed-strategy/compare-sale
  - kind: read
    id: off-the-board
    text: 'What both share has a name: keep them guessing, also called a mixed strategy. When someone gains by reading you, and you gain by not being read, any habit they can spot is one they can use. So mix your choices at random, in proportions that leave them nothing to read. In rock-paper-scissors, that means each throw a third of the time: nothing beats it, though it wins little either. Mix only where the other side is guessing against you. Where people rely on you, such as your team, your customers or your family, being predictable is a strength: it builds trust and lets them plan.'
  - ask: life/keep-them-guessing/spot-checks
  - ask: life/keep-them-guessing/surprise-tests
  - ask: life/keep-them-guessing/evening-call
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you ask who gains by predicting you?'
    situations:
      - "I check other people's work, or set them a test"
      - 'I keep making the same move against a rival'
      - 'I am tempted to vary a routine that others rely on'
    action: 'I will ask who gains by predicting me, and mix at random only if they work against me'
sources:
  - title: 'Chaalwise, the Rock-paper-scissors lab'
    licence: own
---

This lesson starts from the Rock-paper-scissors lab: play it first, 30 throws against a bot that learns your habits, in about five minutes. Then see where the same choice turns up when you check work, set tests or run a shop.

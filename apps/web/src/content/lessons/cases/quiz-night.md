---
title: The quiz night
summary: You run your college quiz society's big night. Bid for the hall, plan the numbers, keep the rounds fresh, and find out what worked.
game: case
stage: 1
order: 2
skills: [weigh-odds, value, unpredictable, read-hidden]
steps:
  - kind: read
    id: intro
    text: You run the quiz society at your college, and this year the big quiz night is your job. The society has ₹40,000 to spend. First you need the main hall. The college gives its best Friday to the society that offers the most money to the hall fund. Each society makes one secret offer, called a sealed bid. Whichever society wins sells tickets to the same Friday crowd, and nobody knows how big it will be. You think the night is worth about ₹12,000 to whoever holds it, but you are not sure.
  - ask: cases/quiz-night/hall-bid
  - kind: read
    id: how-many
    text: You win the hall for ₹10,000, which leaves ₹30,000. Next, food. In each of the last three years, about 150 people said on the sign-up form that they were interested, and about 90 came. This year, 200 have said so.
  - ask: cases/quiz-night/plan-the-food
  - kind: read
    id: the-pattern
    text: You plan for 120. Food at ₹150 a head comes to ₹18,000, leaving ₹12,000 for prizes and printing. Then a member warns you. Last year's winners, a team from another college, have studied your old quizzes. Your rounds always come in the same order, with sport last, and they prepare for it.
  - ask: cases/quiz-night/round-order
  - kind: read
    id: the-night
    text: On the night, 117 people come, close to your plan, and people seem to enjoy it. Afterwards, one member says the new picture round made it a success, and wants every round to be a picture round next year.
  - ask: cases/quiz-night/what-worked
  - kind: plan
    id: plan
    prompt: Use it this week. When will you start from the base rate?
    situations:
      - I plan for how many people will come
      - I hear that many people are interested in something
      - I guess how likely a plan is to work
    action: I will ask how cases like this turned out before, and start from that
---

A story in four decisions, for students. It uses [Don't overpay to win](/reference/strategy/winners-curse/), [Start from the base rate](/reference/strategy/base-rates/), [Be unpredictable](/reference/strategy/be-unpredictable/) and [Test to disprove](/reference/strategy/test-to-disprove/). Each decision follows from the one before.

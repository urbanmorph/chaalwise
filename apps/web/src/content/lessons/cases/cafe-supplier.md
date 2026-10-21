---
title: The café's coffee beans
summary: A roaster raises its price, a rival cuts theirs, and a new supplier offers a contract. Four decisions for someone who runs a small business.
game: case
stage: 4
order: 1
skills: [size-risk, calculate, think-ahead]
steps:
  - kind: read
    id: intro
    text: You run a small café. You buy 40 kilos of coffee beans a month from the same roaster, at ₹800 a kilo. This month the roaster writes that the price is going up by 15%, to ₹920 a kilo. That is ₹4,800 more a month.
  - ask: cases/cafe-supplier/price-rise
  - kind: read
    id: quotes
    text: You list four options and get two quotes. A new roaster across town offers the same kind of beans at ₹820 a kilo. That would save ₹100 a kilo, or ₹4,000 a month on 40 kilos. But you have never used them, and your customers know your coffee.
  - ask: cases/cafe-supplier/new-roaster
  - kind: read
    id: rival
    text: The trial goes well. Nobody notices the change, and the beans arrive on time, so you move all 40 kilos to the new roaster. Then the café across the road cuts its price for a cup of coffee from ₹180 to ₹150. Some of your regulars mention it.
  - ask: cases/cafe-supplier/rival-cut
  - kind: read
    id: contract
    text: 'You keep your price at ₹180 and start a loyalty card. Most regulars stay. Two months on, the new roaster makes an offer: ₹780 a kilo if you sign for a year and take 40 kilos every month, or ₹820 a kilo month by month as now. Signing would save ₹1,600 a month, or ₹19,200 over the year.'
  - ask: cases/cafe-supplier/sign-for-a-year
  - kind: plan
    id: plan
    prompt: Use it this week. When will you size a commitment before you make it?
    situations:
      - a supplier offers a better price for a longer contract
      - I am asked to commit to a fixed amount for months ahead
      - a saving depends on everything going to plan
    action: I will count what it costs in a bad month before I sign
---

A story in four decisions, for someone who runs a small business. It uses [Look at three before choosing](/skills/look-at-three/), the [Size the risk](/skills/size-risk/) course, [Their next move](/skills/their-next-move/) and [Count it through](/skills/count-it-through/). Each decision follows from the one before.

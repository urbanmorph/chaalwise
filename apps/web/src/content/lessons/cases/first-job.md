---
title: Your first job
summary: 'Your first months as a junior analyst: where to spend your time, a report with a problem, a colleague who keeps asking, and your first estimate.'
game: case
stage: 2
order: 1
skills: [think-ahead, composure, cooperate, weigh-odds]
steps:
  - kind: read
    id: intro
    text: You have just started as a junior analyst at a delivery company. Your manager, Priya, asks you for a weekly report on deliveries from the firm's two depots, due each Friday at noon. It is your first week, and you want it to look good.
  - ask: cases/first-job/where-to-spend
  - kind: read
    id: mismatch
    text: You check the numbers, and find a problem. The north depot counts parcels delivered, but the south depot counts van trips. Adding the two together means nothing. It is 11 o'clock on Friday, and the report is due at noon.
  - ask: cases/first-job/send-report
  - kind: read
    id: colleague
    text: Priya thanks you and asks both depots to count the same way. A month later, a colleague, Dev, asks you to cover his Friday task “just this once”. It is the third time this month, and he has never helped you in return. Your own report is due that day too.
  - ask: cases/first-job/colleague-asks
  - kind: read
    id: estimate
    text: Three months in, Priya asks how long a new monthly report will take you. It feels like a two-day job. But your last three jobs each took about one and a half times as long as you estimated.
  - ask: cases/first-job/how-long
  - kind: plan
    id: plan
    prompt: Use it this week. When will you check before you send?
    situations:
      - I am about to send work to my manager or a client
      - I find a problem close to a deadline
      - a number in my work comes from somewhere I have not checked
    action: I will ask what could go wrong, and say so if I am unsure
---

A story in four decisions, for someone starting out at work. It uses [Spend effort where it matters](/skills/spend-effort-where-it-matters/), [The blunder check](/skills/blunder-check/), [Cooperate or defend](/reference/strategy/cooperate-or-defend/) and [Start from the base rate](/reference/strategy/base-rates/). Each decision follows from the one before.

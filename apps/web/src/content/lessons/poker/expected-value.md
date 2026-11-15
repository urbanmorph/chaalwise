---
title: Worth it on average
summary: Judge a choice by what it wins on average over many tries, not by one result.
game: poker
stage: 2
order: 2
skills: [weigh-odds]
steps:
  - kind: read
    id: average
    text: Expected value is what a choice wins or loses on average, if you made it many times. Add up what you win when it goes well and what you lose when it does not, each weighted by how often it happens. A choice worth more than its alternative on average is a good choice, even on the days it loses.
  - ask: poker/expected-value/positive
  - ask: poker/expected-value/negative
  - ask: poker/expected-value/good-call-lost
  - ask: life/judge-by-the-average/promotion
  - ask: life/decisions-not-results/good-chance
  - kind: plan
    id: plan
    prompt: 'Use it away from the table this week. When will you judge a choice by its average?'
    situations:
      - 'a good decision has just turned out badly'
      - 'I choose between a sure thing and a risk'
      - 'I make the same choice again and again, such as a daily habit'
    action: 'I will judge it by its average over many tries, not by the last result'
---

Expected value is the habit of judging a choice by its average over many tries. It keeps a run of bad luck from changing good decisions.

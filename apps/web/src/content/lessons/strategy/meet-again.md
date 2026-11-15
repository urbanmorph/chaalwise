---
title: Cooperate when you will meet again
summary: When you will deal with someone again, cooperate first, answer a grab, forgive a slip and be clear. When a deal is one-off, protect yourself in the terms.
game: strategy
stage: 7
order: 10
skills: [cooperate]
after: labs/prisoners-dilemma
steps:
  - kind: read
    id: on-the-board
    text: "In the Prisoner's Dilemma lab, you and a bot choose at the same time, round after round. Each of you can cooperate (work together) or defect (act for yourself at the other's cost). Both cooperating scores 3 points each, and both defecting 1 each. If one defects while the other cooperates, the defector scores 5 and the other 0. A match lasts about ten rounds, and nobody is told which round is the last."
  - ask: labs/prisoners-dilemma/defect-now
  - ask: labs/prisoners-dilemma/compare-supplier
  - kind: read
    id: off-the-board
    text: "What both share has a name: cooperate when you will meet again. When you will deal with someone again and again, and neither of you knows which time is the last, what you do now is answered later. Robert Axelrod's tournaments, in his 1984 book, found that a simple rule did well: tit for tat, which cooperates first, then copies the other's last move. So start by cooperating, and answer a grab so that it has a price. Forgive a single slip you may have misread, and be clear, so the other side can see that cooperating with you pays. When a deal is one-off, nothing later keeps either side honest: protect yourself in the terms instead."
  - ask: life/meet-again/wholesaler
  - ask: life/meet-again/project-partner
  - ask: life/meet-again/caterer
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you ask whether you will meet again?'
    situations:
      - 'someone I work with often lets me down once'
      - 'I start working with someone new'
      - 'I agree a one-off deal with a stranger'
    action: 'I will cooperate first and say what I expect, or set fair terms if we will not meet again'
sources:
  - title: 'Robert Axelrod, The Evolution of Cooperation (1984)'
    licence: cited-idea
---

This lesson starts from the Prisoner's Dilemma lab: play it first, about ten rounds against each of five bots, in about five minutes. Then see where the same choice turns up with a supplier, a classmate and a caterer.

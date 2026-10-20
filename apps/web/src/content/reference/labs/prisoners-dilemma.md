---
term: "Prisoner's Dilemma"
game: 'labs'
kind: 'concept'
skill: 'cooperate'
level: 'beginner'
aliases: ['PD']
summary: 'Two players each do better by betraying, yet both do better together if both cooperate.'
related: ['labs/tit-for-tat', 'labs/nash-equilibrium', 'strategy/cooperate-or-defend']
try:
  - kind: choice
    id: repeat
    prompt: 'Two teams share a budget that is split again every quarter, with no end date. Each could grab more this quarter. What best keeps both from grabbing?'
    options:
      [
        'A strict rule from above on who gets what',
        'Each knowing a grab now will be answered next quarter',
        'Each team being generous by nature',
      ]
    answer: 1
    feedback:
      - 'Rules help, but they cannot cover everything. The bots in the lab had no rule: tit for tat cooperated because a grab would be answered.'
      - ''
      - 'Kindness alone gets exploited. In the lab, always kind earned the least of all five styles.'
    explanation: 'When the game repeats and nobody knows the last round, what you do now is answered later. That is what makes cooperation last.'
  - kind: choice
    id: known-end
    prompt: 'A partnership will end on a fixed date next month, and both sides know it. What happens to cooperation near the end?'
    options:
      [
        'It holds, since it has worked so far',
        'It weakens: the last rounds have no tomorrow to protect',
        'It grows, as both want to part on good terms',
      ]
    answer: 1
    feedback:
      - 'The record helps, but in the last round nothing comes after, so a betrayal can no longer be answered. Expect it, and protect yourself in the terms.'
      - ''
      - 'Many people do want to part well, and their wider name can keep them honest. But the deal itself no longer gives a reason to, so plan for that.'
    explanation: 'A known end unravels cooperation from the back. That is why the lab never tells you which round is the last.'
  - kind: choice
    id: misread
    prompt: 'A colleague you work well with misses a deadline that hurts you, once. You are not sure it was on purpose. What tends to work best?'
    options:
      [
        'Hit back once, as tit for tat would',
        'Let it go this time, and watch what comes next',
        'Stop relying on them from now on',
      ]
    answer: 1
    feedback:
      - 'Tit for tat does well, but when moves can be misread, one slip sets off a run of payback. Forgiving now and then breaks the echo.'
      - ''
      - 'Cutting them off ends a relationship that has paid you well, over one move you may have misread.'
    explanation: 'When moves can be misread, forgiveness keeps cooperation going. In the lab, two forgiving players stayed well ahead of two tit-for-tats when 1 move in 20 went wrong.'
---

Played once, betraying is better for each player whatever the other does, so both end up worse off than if both had cooperated.

Played many times with the same partner, cooperation can last, because betrayal today costs you tomorrow. It holds only while the future matters enough and nobody knows which round is the last: a known last round unravels, since there is no tomorrow to protect.

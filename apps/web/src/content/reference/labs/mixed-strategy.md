---
term: 'Mixed strategy'
game: 'labs'
kind: 'concept'
skill: 'unpredictable'
level: 'intermediate'
aliases: ['Randomising']
summary: 'Choosing between options with set probabilities, so the other side cannot predict and exploit you.'
related: ['labs/nash-equilibrium', 'strategy/be-unpredictable', 'poker/bluff']
try:
  - kind: choice
    id: pattern
    prompt: 'In rock-paper-scissors, you often follow rock with paper. You have just thrown rock. What does a watchful opponent throw next?'
    options: ['Scissors', 'Paper, to match you', 'Something at random, to be safe']
    answer: 0
    feedback:
      - ''
      - 'Matching your paper only draws. The point of reading you is to play what beats your next throw.'
      - 'Random is safe for them, but wastes what they know. Your habit says paper is coming, and scissors beats it.'
    explanation: 'A habit that can be read can be used. The bot in the lab does exactly this.'
  - kind: choice
    id: random-mix
    prompt: 'Against an opponent who learns your habits, what is the best plan over many throws?'
    options:
      [
        'Switch habits whenever you start to lose',
        'Throw each a third of the time, at random',
        'Never throw the same thing twice in a row',
      ]
    answer: 1
    feedback:
      - 'A new habit is still a habit: a learner picks it up within a few throws.'
      - ''
      - 'Avoiding repeats is itself a pattern. After your rock, a learner knows only paper or scissors can come, and throws scissors: it never loses.'
    explanation: 'A truly random mix, each throw a third of the time, cannot be exploited. It cannot win much either, but nothing beats it.'
  - kind: choice
    id: reliable
    prompt: 'Your team plans its week around the day you send a report. Should you vary the day, to be less predictable?'
    options:
      [
        'Yes: predictable people get exploited',
        'No: here, being predictable helps',
        'Now and then, to keep people alert',
      ]
    answer: 1
    feedback:
      - 'Being read costs you only when someone is working against you. Your team is not; they rely on the pattern.'
      - ''
      - 'Keeping people alert sounds useful, but a surprise report day costs them planning and gains you nothing.'
    explanation: 'Mix only where someone gains by reading you. Where people rely on you, being predictable is a strength.'
---

In rock-paper-scissors, the unexploitable strategy is each throw a third of the time. Against a predictable opponent you can do better, but only by becoming predictable yourself.

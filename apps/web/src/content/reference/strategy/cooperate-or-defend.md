---
term: 'Cooperate or defend'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Trust and reputation']
summary: 'When you will meet again, cooperation and reputation pay. In a one-off, protect yourself in the terms, but remember that few deals are truly one-off.'
why: 'Many situations are repeated games. What you do now changes how others treat you later.'
inLife: 'Suppliers, neighbours and colleagues are repeated games. A one-time sale to a stranger is closer to a one-off, though reviews and referrals mean others may be watching.'
skill: 'cooperate'
related: ['labs/prisoners-dilemma', 'labs/tit-for-tat']
try:
  - kind: choice
    id: long-term
    prompt: 'You will work with a supplier for years. They make a small mistake in your favour on an invoice. What pays best?'
    options:
      [
        'Keep quiet: it was theirs to catch',
        'Point it out: the relationship is worth more',
        'Use it to ask for a bigger discount',
      ]
    answer: 1
    feedback:
      - 'It is their error, and the gain is real today. But when they find it, and they often do, they learn you take what you can, and that costs you in every deal after.'
      - ''
      - 'Pressing an advantage feels shrewd, but it turns their honest slip into a lever against them. Suppliers remember who did that.'
    explanation: 'When you will meet again, trust and reputation pay back many times what one invoice gains.'
  - kind: choice
    id: one-off
    prompt: 'You are selling a used laptop online to a stranger in another city. You will not deal with them again. How do you set the terms?'
    options:
      [
        'Send it first: most buyers are honest',
        'Payment cleared before it ships, and an honest description',
        'Make it sound better than it is: you will not meet again',
      ]
    answer: 1
    feedback:
      - 'Most buyers are honest, but with no future between you, nothing protects you from the one who is not.'
      - ''
      - 'With no next deal, honesty can look optional. But reviews, ratings and complaints travel, and few deals are truly one-off.'
    explanation: 'With no future between you, protect yourself in the terms. That is not a licence to behave badly: others may be watching, and your own good name is a repeated game.'
---

The Prisoner's Dilemma shows the tension. Each side does better for itself by defecting, whatever the other does, yet both do better if both cooperate.

Repetition is what makes cooperation stable: if you expect to meet again and do not know when it will end, betrayal today costs you tomorrow.

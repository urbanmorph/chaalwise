---
term: 'Test to disprove'
game: 'strategy'
kind: 'principle'
level: 'beginner'
aliases: ['Confirmation bias', 'Seek disconfirming evidence', '2-4-6 task']
summary: 'To find out whether you are right, test what would prove you wrong, not what would confirm you.'
why: 'Evidence that fits your idea usually fits many other ideas too, so it cannot tell them apart. Only a test that could fail can show you are wrong before it costs you.'
inLife: 'Before backing a plan, ask what result would show it is wrong, and go and look for that result.'
skill: 'read-hidden'
related: ['strategy/blunder-check', 'strategy/decisions-not-results', 'strategy/information-advantage']
try:
  - kind: choice
    id: two-four-six
    prompt: 'You are told 2, 4, 6 fits a hidden rule, and you guess "numbers going up by 2". Which test tells you most about whether you are right?'
    options: ['8, 10, 12', '1, 2, 3', '2, 4, 6 again, to be sure']
    answer: 1
    feedback:
      - 'It fits your guess, so a yes is what you expect. But it also fits "any numbers going up" and "all even", so a yes cannot tell them apart.'
      - ''
      - 'You already know it gets a yes, so it can tell you nothing new.'
    explanation: 'Your guess says 1, 2, 3 should get a no. If it gets a yes, your guess is wrong. That is the test that can surprise you.'
  - kind: choice
    id: onboarding
    prompt: 'You believe a new welcome call makes customers stay longer. Which check could show you are wrong?'
    options:
      [
        'Ask customers who stayed whether they liked the call',
        'Compare customers who got the call with similar ones who did not',
        'Count the happy emails that mention the call',
      ]
    answer: 1
    feedback:
      - 'Customers who stayed are the ones most likely to like it. Those who left are missing, so this can only agree with you.'
      - ''
      - 'Happy emails come from happy customers. They say nothing about whether the call changed who stayed.'
    explanation: 'A fair comparison could come out against you: if similar customers without the call stay just as long, the call is not what keeps them.'
  - kind: choice
    id: before-backing
    prompt: 'A colleague is sure of a plan and asks for your backing. Which question is most useful to ask first?'
    options:
      ['What evidence supports the plan?', 'What result would show it is wrong?', 'How many people back the plan?']
    answer: 1
    feedback:
      - 'Supporting evidence is easy to find for almost any plan. It shows the plan could be right, not that it is.'
      - ''
      - 'Many backers can share the same blind spot. Agreement is not a test.'
    explanation: 'Naming the result that would sink the plan, then looking for it, is the cheapest way to find a flaw before it costs you.'
---

People test ideas with cases they expect to fit. In Wason's 2-4-6 task (1960), people were told that 2, 4, 6 fits a rule and asked to find it by trying their own triples. Most guessed "numbers going up by 2" and tried 8, 10, 12 and 20, 22, 24. Every test got a yes, so they grew sure, and announced the wrong rule. The real rule was "any three numbers going up". Only about one in five found it at the first try.

Their tests were not wrong; they were weak. A yes to a case your idea predicts fits many other ideas too. The informative test is one your idea says should fail, such as 1, 2, 3 or 6, 4, 2. If it fails, your idea survives a real test; if it passes, you have learnt you were wrong, cheaply.

The habit of looking for and weighing evidence that agrees with what you already think is called confirmation bias (Nickerson 1998). The answer to it is a question: what would change my mind? Then go and look for that.

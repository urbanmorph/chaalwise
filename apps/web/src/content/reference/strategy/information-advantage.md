---
term: 'Act with more information'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Position', 'Wait and see']
summary: 'Deciding after the other side has shown its hand is an advantage. Wait for information when you can.'
why: 'Acting last means acting on more facts. Acting first only pays when it buys something.'
inLife: 'Let the other party name a number first, or wait for the data before committing, when nothing is lost by waiting.'
skill: 'read-hidden'
related: ['poker/position', 'strategy/lead-or-answer']
try:
  - kind: choice
    id: name-a-price
    prompt: 'In a negotiation, the other side asks you to name a price first. You know little about their budget. What helps you most?'
    options:
      [
        'Name a price at once, to look confident',
        'Ask what range they have in mind first',
        'Name your lowest price, to be safe',
      ]
    answer: 1
    explanation: 'Whoever moves second decides with more information. Their answer tells you something; your first number tells them a lot.'
  - kind: choice
    id: last-to-act
    prompt: 'In poker, why is acting last in a round worth so much?'
    options: ['You see what the others did before you decide', 'You get more cards', 'You win ties']
    answer: 0
    explanation: 'Acting last is the same advantage: everyone else has shown something, and you decide knowing it.'
---

Poker builds a whole strategy on this: the player who acts last in a round sees what the others did. The chess version is keeping options open until the position tells you which plan fits.

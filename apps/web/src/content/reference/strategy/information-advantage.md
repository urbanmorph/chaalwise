---
term: 'Act with more information'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Position', 'Wait and see', 'First offer']
summary: 'Deciding after the other side has shown its hand is an advantage when their move tells you something you lack. When you already know the value, moving first can be the edge.'
why: 'Acting last means acting on more facts. Acting first pays when it commits you or anchors the other side: a first number in a negotiation pulls the outcome towards it.'
inLife: 'When you know little about what something is worth, find out before you name a number: ask, or research the market. When you know the market, a confident, well-justified first offer usually helps you.'
skill: 'read-hidden'
related: ['poker/position', 'strategy/lead-or-answer']
try:
  - kind: choice
    id: name-a-price
    prompt: 'A firm wants to buy a design you made and asks you to name a price. You have no idea what such work sells for, or what they can pay. What do you do first?'
    options:
      [
        'Name a high price at once, to anchor them',
        'Ask their budget, and check what similar work sells for',
        'Name a modest price, so as not to lose the deal',
      ]
    answer: 1
    feedback:
      - 'First numbers do anchor, but only if they are well grounded. Knowing nothing, your number may be far too low, or so high it ends the talk.'
      - ''
      - 'Keeping the deal alive feels safe, but a guess made to please them may leave much of the value on the table.'
    explanation: 'When you know little about the value, close the gap before you anchor. Their answer, and the market, tell you what a first number of yours would give away.'
  - kind: choice
    id: know-the-market
    prompt: 'You are selling a used car. Twenty listings show cars like yours sell for 450,000 to 500,000. A buyer asks what you are looking for. What do you say?'
    options:
      [
        'Ask what they had in mind first',
        'Ask 500,000, and show the listings behind it',
        'Ask 450,000, so they are not put off',
      ]
    answer: 1
    feedback:
      - 'Letting them go first feels careful, but you already know the value. Waiting tells you little and hands them the anchor.'
      - ''
      - 'A modest number feels friendly, but it starts the talk at your floor, and the only way from there is down.'
    explanation: 'When you know the value, a confident first number grounded in facts anchors the talk near it. Moving second pays only when their move would tell you something you lack.'
  - kind: choice
    id: last-to-act
    prompt: 'In poker, why is acting last in a round worth so much?'
    options:
      [
        'You see what the others did before you decide',
        'You see more of the shared cards before you decide',
        'The last player may bet more than the others',
      ]
    answer: 0
    feedback:
      - ''
      - 'It can feel that way, but the shared cards are turned over for everyone at once. What you see that others do not is what they did.'
      - 'Going last can feel like having the final say, but the betting limits are the same for every seat.'
    explanation: 'Acting last is the same advantage: everyone else has shown something, and you decide knowing it.'
---

Poker builds a whole strategy on this: the player who acts last in a round sees what the others did. The chess version is keeping options open until the position tells you which plan fits.

Moving first and moving second each have their place. Move first when your move commits you or anchors the other side; move second when their move tells you something you lack. Ask which is true here. See also: lead or answer well.

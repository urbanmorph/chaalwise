---
term: 'Start from the base rate'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Base rate', 'Outside view', 'Base-rate neglect']
summary: 'Before judging one case, ask how often cases like it turn out each way. Start from that, then adjust for what this case shows.'
why: 'Vivid evidence about one case crowds out how common things are. People neglect base rates even when they are told them, and so overrate rare explanations.'
inLife: 'The planning fallacy: asked how long their own project will take, people picture it going to plan. Ask first how long similar projects took, the outside view, then adjust for what really differs about yours.'
skill: 'weigh-odds'
related: ['strategy/regression-to-the-mean', 'strategy/decisions-not-results', 'poker/expected-value']
try:
  - kind: choice
    id: rare-condition
    prompt: '1 person in 100 has a condition. A test finds 9 in 10 people who have it, and wrongly flags 1 in 10 who do not. Someone tests positive. How likely is it they have it?'
    options: ['About 90%', 'About 50%', 'About 8%']
    answer: 2
    feedback:
      - 'That is how often the test finds the condition, not how often a positive is right. With so few people having it, most positives come from the many who do not.'
      - 'It can feel as if the good test and the rare condition cancel out. Count it out of 1,000 people to see how lopsided it is.'
      - ''
    explanation: 'Out of 1,000 people, 10 have it and 9 of them test positive; 990 do not and 99 of them test positive. Only 9 of the 108 positives are real: about 8%.'
  - kind: choice
    id: project-time
    prompt: 'Your team expects its new system to take six months. Of ten similar projects in your firm, eight ran at least half as long again. What is the best estimate?'
    options:
      [
        'Six months: this team knows its plan',
        'Six months, plus a week or two of slack',
        'About nine months, then adjust for real differences',
      ]
    answer: 2
    feedback:
      - 'The plan is the inside view, and each of those ten teams had a plan too. Most of them still ran over.'
      - 'Some slack feels prudent, but a week or two is far less than similar projects needed. Start from how they went.'
      - ''
    explanation: 'Start from the outside view: similar projects mostly ran half as long again. Then adjust only for what truly differs, such as a smaller scope.'
  - kind: choice
    id: which-bag
    prompt: 'Eight bags in ten are mostly red (7 red balls, 3 blue). Two are mostly blue (3 red, 7 blue). A bag is picked at random and one ball drawn: it is blue. Which kind of bag is it more likely to be?'
    options: ['Mostly blue: the ball says so', 'Equally likely either way', 'Mostly red: there are many more of them']
    answer: 2
    feedback:
      - 'A blue ball does point towards a mostly-blue bag, but those bags are rare. Out of 100 picks, 24 blue balls come from mostly-red bags and only 14 from mostly-blue ones.'
      - 'The ball moves you towards blue, but not all the way from 8 in 10 to even. It still came from a mostly-red bag about 63 times in 100.'
      - ''
    explanation: 'Start from 8 in 10, then adjust. Out of 100 picks, a blue ball comes from a mostly-red bag 24 times and from a mostly-blue bag 14 times.'
---

Daniel Kahneman and Amos Tversky showed in 1973 that people judge how likely something is by how well a case fits a picture, and largely ignore how common each possibility is. Given a description that sounds like an engineer, people said engineer whether they were told the group held 30% or 70% engineers.

The fix is to take the outside view first. Kahneman and Dan Lovallo (1993) describe it: find a reference class of similar cases, see how they turned out, and start there. Only then adjust for what you know about this case. Roger Buehler and colleagues (1994) found students finished their theses later than even their worst-case guesses; the outside view would have warned them.

Counting helps. Rather than percentages, imagine 100 or 1,000 cases and count how many end each way. The answer is often far from what the evidence alone suggests.

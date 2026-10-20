---
term: 'Regression to the mean'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Regression towards the mean', 'Reversion to the mean', 'Lucky streak']
summary: 'When a result is part skill and part luck, an extreme result is usually followed by a more ordinary one, whatever you do.'
why: 'If you read too much into one extreme result, you credit or blame the wrong things. The skill behind it stays; the luck does not come back on demand.'
inLife: 'Praise after a best-ever quarter and blame after a worst-ever one both seem to work backwards, because the next quarter is usually closer to normal either way. Judge people, teams and plans on several results, not one.'
skill: 'weigh-odds'
related: ['strategy/base-rates', 'strategy/decisions-not-results']
try:
  - kind: choice
    id: record-month
    prompt: 'Your best salesperson had a record month, far above her usual. What should you expect next month?'
    options:
      [
        'Another month about as strong',
        'A good month, but closer to her usual',
        'A weak month, to balance the record out',
      ]
    answer: 1
    feedback:
      - 'A record usually takes skill and good luck together. The skill stays; the luck does not come back on demand.'
      - ''
      - 'Luck does not owe her anything, so it does not swing back to even things out. Expect something near her usual, not below it.'
    explanation: 'An extreme result is part skill, part luck. Expect the skill to stay and the luck to fade: a result closer to her usual.'
  - kind: choice
    id: praise-and-blame
    prompt: "After a cadet pilot's worst landing, the instructor shouts, and the next landing is better. After a best landing, he praises, and the next is worse. What does this show?"
    options:
      [
        'Shouting works and praise backfires',
        'Little: the next landing is usually more ordinary',
        'Cadets try harder after being shouted at',
      ]
    answer: 1
    feedback:
      - 'It looks that way, but the next landing would move towards normal whatever he did. A best landing is usually followed by a worse one.'
      - ''
      - 'They might, but this pattern cannot show it: a worst landing is usually followed by a better one with no shouting at all.'
    explanation: "Extreme landings are partly luck, so the next one is usually closer to the cadet's average, after praise and shouting alike."
  - kind: choice
    id: worst-junction
    prompt: 'A safety camera goes up at the junction with the most crashes last year. Next year, crashes there fall. What should you check before crediting the camera?'
    options:
      [
        'Nothing: the fall shows it works',
        'Whether crashes rose at nearby junctions',
        'Whether similar junctions with no camera also improved',
      ]
    answer: 2
    feedback:
      - 'The fall is real, but the junction was picked for its worst year. Some of that was bad luck, which would not repeat, camera or not.'
      - 'Crashes moving elsewhere is worth a look, but it does not explain the fall. A junction picked for its worst year would likely improve anyway.'
      - ''
    explanation: 'Picking the worst case and measuring again builds in regression to the mean. Compare with similar junctions that got no camera.'
---

Francis Galton noticed it in 1886: tall parents had children who were tall on average, but less tall than their parents, and short parents had children taller than themselves. He called it regression towards mediocrity. Nothing pulls the children back; the parents were extreme partly by chance, and chance does not run in families.

Daniel Kahneman tells, in Thinking, Fast and Slow (2011), of flight instructors who were sure that praise made cadets worse and shouting made them better. Both were regression: an unusually good or bad landing is usually followed by a more ordinary one.

Whenever results mix skill and luck, the most extreme ones are the luckiest or unluckiest. Expect them to fall back towards the average, and judge on more than one result before you praise, blame or change course.

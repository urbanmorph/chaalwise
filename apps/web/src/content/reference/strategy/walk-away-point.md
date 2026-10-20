---
term: 'Know your walk-away point'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['BATNA', 'Reservation price', 'Zone of agreement', 'ZOPA']
summary: 'Before you bargain, know what you will do if there is no deal. That sets the least you should accept, and any deal lies between your walk-away point and theirs.'
why: 'A deal is worth taking only if it beats your best alternative to it. Knowing that alternative tells you when to say yes, when to say no, and how hard you can push.'
inLife: 'Before a salary talk, a supplier contract or a sale, find your best other option and improve it if you can: another offer, another supplier, another buyer. Then you know the least you will take, and you can walk away calmly when a deal falls short of it.'
skill: 'value'
related: ['strategy/information-advantage', 'strategy/lead-or-answer', 'labs/zero-sum-game']
try:
  - kind: choice
    id: below-walk-away
    prompt: 'You have a firm job offer of 900,000 a year. A second firm, which you like about as much, offers 850,000 and says that is its limit. What do you do?'
    options:
      [
        'Accept 850,000: a limit is a limit',
        'Decline, unless they can beat 900,000',
        'Ask for 875,000, to meet in the middle',
      ]
    answer: 1
    feedback:
      - 'Their limit is theirs, not yours. You already have 900,000 on the table, so 850,000 leaves you worse off than walking away.'
      - ''
      - 'Meeting in the middle feels fair, but 875,000 is still below the 900,000 you already have. The middle of a bad range is still bad.'
    explanation: 'Your walk-away point is your best alternative: here, the other offer of 900,000. Never accept a deal worth less than it.'
  - kind: choice
    id: deal-zone
    prompt: 'You will sell a machine for no less than 40,000. You later learn the buyer would have paid up to 55,000. Where could a deal have happened?'
    options: ['Anywhere above 40,000, your floor', 'Only at 47,500, halfway between', 'Anywhere from 40,000 to 55,000']
    answer: 2
    feedback:
      - 'Your floor is only one end. Above 55,000 the buyer would rather walk away, so the zone stops there.'
      - 'Halfway is one possible deal, and talks often end near it. But any price in the zone beats no deal for both sides.'
      - ''
    explanation: 'The zone of agreement runs from your walk-away point to theirs. Where in it you land depends on the bargaining; outside it, no deal is the right result.'
  - kind: choice
    id: best-lever
    prompt: 'A supplier is your only source for a key part, and talks on price have stalled. What most improves your position?'
    options:
      [
        'Hold out longer than they can',
        'Find a second supplier you could switch to',
        'Explain how much you need the part',
      ]
    answer: 1
    feedback:
      - 'Patience can help, but if they know you have nowhere else to go, waiting costs you more than it costs them.'
      - ''
      - 'Being open about interests can help find a deal, but saying you have no alternative tells them they can ask more.'
    explanation: 'A real alternative raises your walk-away point, and the other side must beat it to keep you. Improving it is usually your strongest lever.'
---

Roger Fisher and William Ury, in Getting to Yes (1981), call it your BATNA: your best alternative to a negotiated agreement. It is the standard any offer must beat. They argue that the better your BATNA, the stronger your hand, so the most useful work is often done before the talks: finding and improving your other options.

Howard Raiffa, in The Art and Science of Negotiation (1982), turns the same idea into numbers. Each side has a reservation price, the point at which it would rather walk away. If the buyer's top price is above the seller's bottom price, there is a zone of possible agreement between them, and any deal in it beats no deal for both. If not, no deal is the right result.

Work out the other side's walk-away point too: what will they do if you say no? And keep your own to yourself. When you know what the deal is worth, a confident first offer with reasons behind it tends to pull the result towards you. When you do not, find out before you name a number. See also: act with more information.

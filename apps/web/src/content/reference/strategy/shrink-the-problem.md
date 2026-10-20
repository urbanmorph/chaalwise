---
term: 'Shrink the problem'
game: 'strategy'
kind: 'principle'
level: 'intermediate'
aliases: ['Candidate moves', 'Narrow the options']
summary: 'When there are too many options, cut them to a few good candidates, then compare those properly.'
why: 'Nobody can examine everything. Choosing what to examine is itself the skill.'
inLife: 'Before comparing twenty suppliers or job offers in detail, cut the list to the few worth a close look. Keep the cutting rules few, because one hard rule can throw out the best option on a single point.'
skill: 'plan-long'
related: ['strategy/count-it-through', 'strategy/patterns-save-thinking']
lesson: 'strategy/shrink-the-problem'
try:
  - kind: move
    id: candidates
    prompt: 'Too many moves to compare? Look at checks, captures and threats first. One check wins the queen.'
    position: '2q3k1/5ppp/8/3N4/8/8/5PPP/R5K1 w - - 0 1'
    answers: ['d5e7']
    hint: 'A knight check that also hits c8.'
    explanation: 'Ne7+ checks the king and attacks the queen, which falls next move. Starting from forcing moves cut thirty choices to three, and one of them won.'
---

Start with forcing moves (checks, captures, threats), then moves that improve your worst piece. Two or three candidates, examined well, beat ten examined badly.

Off the board, first make sure you have more than one real option; then cut to the few worth comparing. More decisions go wrong from looking at too few options than too many.

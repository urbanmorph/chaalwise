---
term: 'Fair shares (the Shapley value)'
title: 'The Shapley value and the core: how to split what a group makes by what each person adds'
game: 'labs'
kind: 'concept'
skill: 'value'
level: 'intermediate'
aliases:
  [
    'Shapley value',
    'The core',
    'Fair division',
    'Cost sharing',
    'Cooperative game',
    'Coalitional game',
    'Marginal contribution',
    'Sharing a cab fare',
  ]
summary: 'Split what a group makes by what each person adds on average, and check that no one, and no smaller group, would do better on their own.'
why: 'An equal split ignores what each person brings, and a split by who pushes hardest rewards power, not work. Both can leave someone better off walking away.'
inLife: 'Sharing a cab with different stops, splitting a team bonus or a prize, dividing a delivery charge. Work out what each person adds, and check that no one and no pair would do better alone.'
related: ['labs/fairness-and-trust', 'strategy/walk-away-point', 'labs/logrolling']
try:
  - life/shapley-value/cab-fare
  - life/shapley-value/team-bonus
  - life/shapley-value/prize-account
sources:
  - title: 'Lloyd Shapley, A value for n-person games (1953)'
    licence: cited-idea
  - title: 'Donald Gillies, Solutions to general non-zero-sum games (1959)'
    licence: cited-idea
  - title: 'Stephen Littlechild and Guillermo Owen, A simple expression for the Shapley value in a special case (1973)'
    licence: cited-idea
---

When people make something together that none of them could make as well alone, how should they share it? Game theory calls this a cooperative game. For every group of the people, it lists what that group could make on its own.

The first test is whether anyone would leave. A split is in the core, an idea set out by Donald Gillies (1959), if no person and no smaller group would do better on their own. If two people could make 72 points without the third, a split that gives them 60 between them will not last. The core is often wide, though. Many splits pass the test, so it rules some out without picking one.

Lloyd Shapley (1953) gave a way to pick one. Imagine the people joining one at a time, and note what each adds when they join: the group's points with them, less the points without them. What someone adds depends on who is already there, so take every order in which they could join, and give each person the average of what they added. With three people there are six orders. This is the Shapley value. It shares out exactly the whole, it pays two people who add the same the same amount, and it pays nothing to someone who adds nothing. In many cases, though not all, it also lies in the core.

Sharing a cab is a good example. Three people ride along one road and get off at different stops. Stephen Littlechild and Guillermo Owen (1973) showed that the Shapley split has a simple form for planes sharing an airport runway, and the cab is the same problem. Each stretch of road is paid for equally by everyone who rides it. The first stretch is shared by all, and the last is paid by the one who rides it alone.

An equal split ignores what each person adds. A split by bargaining power, such as "you need me, so I want half", rewards who holds what the others need, not what they add. The Shapley split pays each person for their part in what the group makes.

---
term: 'Outs'
title: 'Outs in poker: what they are and how to count them'
game: 'poker'
kind: 'odds'
level: 'beginner'
aliases: ['Poker outs', 'Counting outs', 'Rule of 4 and 2']
summary: 'An out is an unseen card that would make the hand you are drawing to. Count your outs, then turn them into your chance of hitting.'
lesson: 'poker/outs-and-odds'
try:
  - 'poker/outs-and-odds/open-ended'
  - 'poker/outs-and-odds/rule-of-four'
related: ['poker/pot-odds', 'poker/hand-rankings', 'poker/equity', 'strategy/blunder-check']
faq:
  - q: 'What is an out in poker?'
    a: 'An out is an unseen card that would give you the hand you are drawing to. With four hearts and a card still to come, every heart you cannot see is an out.'
  - q: 'How do you count outs in poker?'
    a: 'Count the unseen cards that would complete your hand. A flush draw has 9 outs: a suit has 13 cards and you can see 4. An open-ended straight draw has 8, and an inside straight draw has 4. Count a card that completes two draws only once.'
  - q: 'How many outs does a flush draw have?'
    a: 'Nine. A suit has 13 cards. With two in your hand and two on the table, you can see 4, so 9 are still unseen.'
  - q: 'What is the rule of 4 and 2?'
    a: 'A quick way to turn outs into a chance. On the flop, with two cards to come, multiply your outs by four. On the turn, with one card to come, multiply by two. Nine outs give about 36% on the flop and 18% on the turn; worked out exactly, they are 35% and 20%.'
  - q: 'Does every out win?'
    a: 'Not always. A card that makes your hand can make a better one for someone else. A heart that gives you a flush might also pair a shared card, giving another player a full house. Count fewer outs when the shared cards make that likely.'
---

Sometimes your hand is not made yet, but one more card could make it strong. Say you hold the ace and five of hearts, and the first three shared cards are the king of hearts, nine of hearts and two of clubs. That is four hearts, so one more heart makes a flush. This is called a flush draw. The deck has 13 hearts and you can see 4, so 9 hearts are left: 9 outs.

## How to count outs

Count the cards you cannot see that would complete your hand. Some draws come up again and again:

| Draw                            | Your cards | Shared cards | Outs | Flop to river   | Turn to river   |
| ------------------------------- | ---------- | ------------ | ---- | --------------- | --------------- |
| Flush draw                      | A♥ 5♥      | K♥ 9♥ 2♣     | 9    | 35% (rule: 36%) | 20% (rule: 18%) |
| Open-ended straight draw        | 8♠ 7♦      | 6♣ 5♥ K♠     | 8    | 31% (rule: 32%) | 17% (rule: 16%) |
| Inside straight draw            | 9♠ 8♦      | 6♣ 5♥ K♠     | 4    | 16% (rule: 16%) | 9% (rule: 8%)   |
| Flush and straight draw         | 8♥ 7♥      | 6♥ 5♣ K♥     | 15   | 54% (rule: 60%) | 33% (rule: 30%) |
| Two cards higher than the table | A♠ K♦      | 9♣ 6♥ 2♠     | 6    | 24% (rule: 24%) | 13% (rule: 12%) |

An open-ended straight draw has four cards in a row, so a card at either end completes it: here any nine or any four. An inside straight draw needs one rank in the middle, here a seven. With a flush and a straight draw together, 9 hearts and 8 straight cards make 17, but two of those straight cards are hearts, already counted: 15 outs. Two cards higher than the table give 6 outs to a pair, though a pair may not be enough to win.

## From outs to a chance: the rule of 4 and 2

The shared cards come in three steps: three at once (the flop), then a fourth (the turn), then a fifth (the river). For a quick estimate of your chance in percent, multiply your outs by four on the flop, with two cards to come. On the turn, with one card to come, multiply by two. The table shows the rule beside the chance worked out exactly, from the cards you cannot see: 47 on the flop, 46 on the turn.

The rule of four works for about eight outs or fewer, and only when no more betting can come before the last card. With 15 outs it says 60%; the real chance is 54%.

Count carefully: an out that also helps the other player is not really yours.

Your chance is half of the decision. The other half is the price of the call: see [pot odds](/reference/poker/pot-odds/).

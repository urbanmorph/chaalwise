---
title: Not so fast
summary: Before you push on with your plan, ask what the other side wants, and stop it before it starts.
game: strategy
stage: 4
order: 1
skills: [think-ahead]
after: chess/discovered-attack
steps:
  - kind: read
    id: on-the-board
    text: On the board, Black sees what White wants. Bxh7+ would uncover the rook on the queen. Black does not wait for it. ...Qe7 takes the queen off the line first, and the threat is gone before it starts.
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 b - - 0 1
    highlight: [d1, d3, d8]
  - kind: move
    id: stop-the-fork
    prompt: Black's knight wants to jump to c2 with check, forking your king and rook. Stop it before it starts.
    position: 3r2k1/p4ppp/8/4p3/4P1b1/n4N2/P4PPP/R3KB2 w - - 0 1
    measures: anticipation
    answers: [a1c1, a1d1]
    hint: Guard c2, or make sure a check from there costs you nothing.
    explanation: Rc1 guards c2, so the knight cannot land there. Rd1 also works. It offers to trade rooks, and after ...Rxd1+ Kxd1 your king guards c2. Moving your king dodges the check, but the knight still lands on c2 and chases your rook.
  - kind: read
    id: off-the-board
    text: Off the board, before you push on with your own plan, ask what the other side most wants to do next. If it would hurt, spend a quiet step stopping it now. Preventing a problem is usually cheaper than fighting it once it has started.
  - kind: choice
    id: best-engineer
    prompt: Your best engineer has been approached by a rival paying 15% more. She has not said she will leave, and pay reviews are in six months. Replacing her would cost about six months of her pay. What do you do now?
    options:
      - Wait for the review, and match an offer if she gets one
      - Talk with her now about pay and her work, before any offer
      - Start interviewing quietly, in case she goes
    answer: 1
    feedback:
      - Matching an offer means acting after she has decided to look, often too late. It answers the threat once it is running.
      - ''
      - Interviewing prepares for the loss instead of preventing it, and if she hears of it, it may push her out.
    explanation: A 15% rise costs under two months of her pay a year; losing her costs about six. Talking before an offer arrives is the quiet move that stops the threat.
  - kind: choice
    id: lab-sessions
    prompt: Every year, the lab sessions for final projects are fully booked in the first week of term. You will need about 10 sessions, but your plan will not be clear until week three. What do you do?
    options:
      - Book 10 sessions this week, and adjust them later
      - Wait until week three, when you know what you need
      - Plan to share a friend's sessions if it fills up
    answer: 0
    feedback:
      - ''
      - Waiting for a clear plan feels careful, but by week three the sessions are gone. The threat is known; it only needs acting on.
      - A friend's sessions are theirs first. That plan answers the problem after it has happened, if it can be answered at all.
    explanation: You know what will happen in week one. Booking now stops the problem before it starts, and changing a booking later is cheap.
  - kind: choice
    id: compare
    prompt: "What does ...Qe7 share with the firm's move?"
    position: 3q2k1/5ppp/8/8/8/3B4/5PPP/3R2K1 b - - 0 1
    alongside: 'A firm signs up a second supplier before its only one can raise prices.'
    options:
      - 'Stop their best plan before it starts'
      - 'Both move something out of the way'
      - 'Wait for the threat, then answer it'
    answer: 0
    feedback:
      - ''
      - 'Moving out of the way is the surface likeness. The point is when: before the other side can act.'
      - 'Waiting lets the threat start. Once Bxh7+ comes, the queen is lost; once prices rise, they are hard to bring down.'
    explanation: 'Black sees Bxh7+ coming and takes the queen off the line. The firm sees a price rise coming and finds a second supplier. Both act first, quietly.'
  - kind: plan
    id: plan
    prompt: 'Use it this week. When will you stop a problem before it starts?'
    situations:
      - 'I am about to push on with my own plan'
      - 'I can see a deadline, booking or price that will bite'
      - 'someone on the other side has an obvious next step'
    action: 'I will ask what they most want to do next, and take one quiet step to stop it'
---

Chess players call it prophylaxis. Off the board, asking what the other side wants becomes a habit only if you practise it there too, as this week's task asks.

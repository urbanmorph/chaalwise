---
title: What the middlegame is about
summary: Once the pieces are out, the question becomes "what is my plan?", and the pawns help answer it.
game: chess
stage: 5
order: 0
skills: [plan-long]
measures: planning
steps:
  - kind: read
    id: the-question
    text: In the middlegame the pieces are out and the kings are tucked away. The question changes from how to develop to what to aim for. Plans come from the pawns, which decide which squares are strong, which files can open and where to attack.
    position: 'moves: e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 Nbd2 Be6 Nf1 h6'
  - kind: choice
    id: where-plans-come-from
    prompt: Where do middlegame plans mostly come from?
    options:
      - The pawn structure
      - The name of the opening you played
      - Which side has more pieces developed
    answer: 0
    feedback:
      - ''
      - 'The opening gives you a start, but once play leaves the book, the pawns on the board decide what to do.'
      - 'That matters in the opening. In the middlegame both sides are out, and the pawns show where to play.'
    explanation: Pawns move slowly and cannot go back, so they fix the shape of the game. Plans follow from that shape.
  - kind: read
    id: three-questions
    text: Three questions help at every move. Where are the weaknesses? Which is my worst piece? What does my opponent want? To take each one further, look up pawn structure, outposts and open files in the reference.
  - kind: choice
    id: good-question
    prompt: Which is a good middlegame question to ask yourself?
    options:
      - Which of my pieces is doing least, and how can it do more?
      - Which enemy piece can I attack right now?
      - How can I trade off as many pieces as possible?
    answer: 0
    feedback:
      - ''
      - 'Attacking for its own sake often chases a piece to a better square. Ask what your position needs first.'
      - 'Trades help when you are ahead. Trading for its own sake can leave you with your worst pieces.'
    explanation: Improving your worst piece is often the best plan when nothing else is happening.
---

The opening gets your pieces out. The middlegame asks what they are for.

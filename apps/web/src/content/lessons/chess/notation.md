---
title: How moves are written
summary: Read and write chess moves, so you can follow any book, video or game record.
game: chess
stage: 0
order: 12
skills: []
measures: board
steps:
  - kind: read
    id: piece-letters
    text: 'Each move is written as a piece letter and the square it goes to. K is the king, Q the queen, R a rook, B a bishop and N a knight, since K is already the king. Pawns have no letter. So Nf3 means a knight goes to f3, and e4 means a pawn goes to e4.'
    position: start
  - kind: move
    id: play-nf3
    prompt: Play Nf3.
    position: start
    answers: [g1f3]
    hint: N is the knight. Which knight can reach f3?
    explanation: 'The knight on g1 jumps to f3. Only the piece and the square it lands on are written, not where it came from.'
  - kind: read
    id: symbols
    text: "A few signs add the rest. x means a capture, as in Nxe5. + means check and # means checkmate. O-O is castling on the king's side and O-O-O on the queen's side. =Q means a pawn becomes a queen, as in e8=Q. A pawn that captures is named by the file it leaves, so exd5 is the e-pawn taking on d5. Moves come in numbered pairs, White's then Black's, and a Black move on its own gets three dots in front, as in ...e5."
  - kind: choice
    id: knight-takes
    prompt: Your knight on f3 takes the pawn on e5. How is that written?
    position: 'moves: e4 e5 Nf3 Nc6'
    options:
      - Nxe5
      - Ne5
      - Kxe5
      - xNe5
    answer: 0
    feedback:
      - ''
      - 'Ne5 is a knight moving to an empty e5. A capture needs the x.'
      - 'K is the king. The knight is N, because K was already taken.'
      - 'The x goes between the piece and the square, not in front.'
    explanation: 'N for the knight, x for the capture, e5 for the square. Read aloud, it is "knight takes e5".'
    highlight: [e5]
    arrows: [f3e5]
  - kind: move
    id: play-exd5
    prompt: Play exd5.
    position: 'moves: e4 d5'
    answers: [e4d5]
    hint: No letter, so it is a pawn. Which pawn stands on the e-file?
    explanation: 'Your e-pawn takes on d5. A pawn capture names the file the pawn starts on, because pawns have no letter.'
  - kind: choice
    id: write-promotion
    prompt: White pushes the pawn from b7 to b8, makes a queen, and the new queen gives check. How is that written?
    position: 4k3/1P6/8/8/8/8/8/4K3 w - - 0 1
    options:
      - b8=Q+
      - b8=Q#
      - Pb8=Q
      - Qb8+
    answer: 0
    feedback:
      - ''
      - '# means mate, but the black king can still step to d7, e7 or f7. Use + for check.'
      - 'Pawns have no letter, and the check needs its +.'
      - "That reads as a queen moving to b8. A promotion names the pawn's square, then =Q."
    explanation: 'The square, then =Q for the new piece, then + for the check.'
    arrows: [b7b8]
  - kind: choice
    id: read-mate
    prompt: 'The game record ends with Qxf7#. What happened?'
    position: 'moves: e4 e5 Qh5 Nc6 Bc4 Nf6'
    options:
      - The queen took on f7, and it was mate
      - The queen took on f7, and it was check
      - The queen moved to f7, and it was mate
    answer: 0
    feedback:
      - ''
      - '+ is check. # is the sign for mate, so the game is over.'
      - 'The x says the queen captured something on f7, here the pawn.'
    explanation: "Q for the queen, x for the capture, f7 for the square, # for mate. This short mate is called Scholar's mate."
    arrows: [h5f7]
    highlight: [e8]
---

Books, videos and online game records all write moves the same short way. A few letters and signs are all you need to read them.

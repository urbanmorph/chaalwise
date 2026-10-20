---
title: A map of the openings
summary: Openings fall into five families by their first moves, because the first moves decide what kind of game it will be.
game: chess
stage: 3
order: 5
skills: [plan-long]
measures: opening
steps:
  - kind: read
    id: open-games
    text: Openings are grouped by their first moves, because the first pawn moves decide the structure, and the structure decides the kind of game. Open games start 1.e4 e5. Lines open early, pieces come out fast and tactics come soon. The Italian, the Ruy Lopez and the Scotch are open games.
    position: 'moves: e4 e5'
    highlight: [e4, e5]
  - kind: read
    id: semi-open
    text: Semi-open games start 1.e4 and anything but ...e5. Black avoids the symmetrical 1...e5 and gets a different pawn structure. The game is sharp in the Sicilian, and solid in the Caro-Kann and the French. The Sicilian (1...c5), the French (1...e6), the Caro-Kann (1...c6) and the Scandinavian (1...d5) are semi-open.
    position: 'moves: e4 c5'
    highlight: [e4, c5]
  - kind: read
    id: closed
    text: Closed games start 1.d4 d5. This map also puts the other 1.d4 replies that are not ...Nf6 here, such as the Dutch (1...f5). The play is slower, about pawn structure and manoeuvring. The Queen's Gambit and the Slav are closed games, and the London System is a way for White to play them.
    position: 'moves: d4 d5'
    highlight: [d4, d5]
  - kind: read
    id: indian
    text: Indian games start 1.d4 Nf6. Black lets White take the centre with pawns, then attacks it with pieces and pawn breaks. The King's Indian, the Nimzo-Indian and the Grünfeld are Indian games.
    position: 'moves: d4 Nf6'
    highlight: [d4, f6]
  - kind: read
    id: flank
    text: Flank openings start 1.c4, 1.Nf3 or 1.g3. White controls the centre from the side, and often reaches the other families by another road. The English (1.c4) and the Réti (1.Nf3) are flank openings.
    position: 'moves: c4'
    highlight: [c4]
  - kind: choice
    id: caro-kann
    prompt: 1.e4 c6, the Caro-Kann. Which family?
    position: 'moves: e4 c6'
    options:
      - Open games
      - Semi-open games
      - Closed games
      - Indian games
    answer: 1
    feedback:
      - 'Open games need 1...e5. Here Black answered 1.e4 with ...c6.'
      - ''
      - 'Black soon plays ...d5, but closed games start with 1.d4. This one began 1.e4.'
      - 'Indian games start 1.d4 Nf6. This one began 1.e4.'
    explanation: White played 1.e4 and Black answered with something other than ...e5, so it is semi-open.
  - kind: choice
    id: kings-indian
    prompt: 1.d4 Nf6 2.c4 g6. Which family?
    position: 'moves: d4 Nf6 c4 g6'
    options:
      - Closed games
      - Indian games
      - Flank openings
    answer: 1
    feedback:
      - 'White began 1.d4, but closed games need 1...d5. Black answered ...Nf6.'
      - ''
      - '2.c4 is the English move, but the game began 1.d4, so it is not a flank opening.'
    explanation: 1.d4 Nf6 makes it an Indian game. With ...g6 it is heading for the King's Indian or the Grünfeld.
  - kind: choice
    id: our-repertoire
    prompt: Your repertoire is the Italian as White, 1...e5 against 1.e4, and 1...d5 against 1.d4. Which families are those?
    options:
      - Open games, and a closed game against 1.d4
      - Open games, and an Indian game against 1.d4
      - Semi-open games, and an Indian game against 1.d4
    answer: 0
    feedback:
      - ''
      - 'Right for 1.e4. But Indian games start 1...Nf6, and against 1.d4 you play 1...d5, a closed game.'
      - 'Semi-open means Black avoids 1...e5. You answer 1.e4 with 1...e5, which makes an open game.'
    explanation: The Italian and 1...e5 are open games, where development and tactics come first. Against 1.d4, 1...d5 makes it a closed game.
---

There are hundreds of named openings, but only a few families. Knowing the family tells you what kind of game to expect before you know the name.

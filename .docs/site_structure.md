# Project Site Structure

## 1. Home

- A hero page with an animating background

## 2. /commanders

- A page with a list of all commanders registered in tournaments and some stats associated with them

### 2.1. /commanders/:id

- A page with a detailed view of a commander and several rich statistics specific to that commander
- Contains a list of all cards played by that commander in tournaments
- Contains a list of top-performing deck lists that play that commander
- Contains a list of all players who have played that commander in tournaments in order of performance

### 2.1.1. /commanders/:id/cards/:card_id

- A page with a detailed view of a card played by the commander in tournaments and several rich statistics specific to that card

## 3. /decks

- A page with a list of all deck lists registered in tournaments and some stats associated with them

### 3.1. /decks/:id

- A page with a detailed view of a deck list and several rich statistics specific to that deck list
- Contains a list of all cards played in that deck list in tournaments
- Contains a link to which tournaments the deck list was played in
- Contains a link to the player who played the deck list
- Each card contains a link to /commanders/:id/cards/:card_id

## 4. /players

- A page with a list of all players registered in tournaments and some stats associated with them, organized by ELO

### 4.1. /players/:id

- A page with a detailed view of a player and several rich statistics specific to that player
- Contains a list of all deck lists played by that player in tournaments
- Contains a list of all commanders played by that player in tournaments

## 5. /tournaments

- A page with a list of all tournaments registered in the database and some stats associated with them

### 5.1. /tournaments/:id

- A page with a detailed view of a tournament including rounds, matchups, and final standings

## 6. /about

- A page with information about the project, the data sources, and the team behind it

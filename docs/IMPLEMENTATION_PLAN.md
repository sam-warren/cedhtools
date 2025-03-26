# Implementation Plan

## 1. Introduction
The cedhtools application is a web app that allows users to analyze their decks against historical tournament data to make informed decisions on card inclusions or exclusions in their decks. 

### 1.1 Technical Overview

Front End:
- Next.js
- TailwindCSS
- Shadcn

Back End:
- Supabase

Authentication:
- Supabase Auth
- Google OAuth

## 2. Implementation Plan

### 2.1 Front End
- The user will be able to log in using Google OAuth and their account will be automatically managed by Supabase
- The user will be able to upload a Moxfield Deck URL to analyze their deck
- The user will be able to view in table form the cards in their deck and their respective statistics
- The user will be able to see when the last ETL process was run

### 2.2 Back End
- The API will be built in Next.js and will be hosted on Vercel
- The API will be connected to Supabase to store user data and deck data
- The API will have the following routes:
    - POST /api/deck/analysis
- The API will be connected to the Supabase database to fetch the deck data and perform the analysis
- The API will return the analysis results to the user

### 2.3 Extract, Transform, Load (ETL) Process
- The ETL process will be run daily to ingest new tournament data from Topdeck.gg
- Initial seed will take a very long time, subsequent ETL processes will be much faster
- We will first query the database to see when the last ETL process was run and only fetch data from the last ETL process to the current date
- The ETL process will be run through Vercel Serverless Functions
- The ETL process will fetch tournament data for the past 6 months in 1-week batches for initial seed
- For each week, we get a response from the topdeck API. We are only interested in storing key statistics:
    In each of the tournaments returned from POST https://topdeck.gg/api/v2/tournaments (returns an array):
        In each of the objects in "standings" (array within tournament object):
            - decklist: the decklist of the player. We will only be storing Moxfield decklists (must contain "moxfield.com/decks/{some id}")
            - wins: number of wins the player had in the tournament
            - losses: number of losses the player had in the tournament
            - draws: number of draws the player had in the tournament
    For each of these Moxfield decklists, we need to make a 1-second rate-limited response to the Moxfield API https://api2.moxfield.com/v3/decks/all/{the id of the decklist}  to get the cards in the decklist
    From the Moxfield response we will look in the "boards" > "commanders" > "cards" object to get the commander(s) of the deck
        Each card in this board has a "card" object with a "name" field and "uniqueCardId" field - we use this to uniquely identify commanders
        A deck can have one or two commanders, but not less than one or more than two. A commander pair is unique regardless of the order of the commanders. A deck with commanders A and B is the same as a deck with commanders B and A. This commander pair uniquely identifies the notion of a "Commander" in the metaphysical sense - it uniquely identifies a deck's strategy and what kind of cards it plays which we use for analytics.
    Once we have identified the commander(s) of the deck, we will look in "boards" > "mainboard" > "cards" object to see what cards are in the deck
        Each card in this board has a "card" object with a "name" field and "uniqueCardId" field - we use this to uniquely identify a card across multiple commander decks.
    For each commander-card pair, we will store the following statistics in the database:
        - wins: the number of wins the deck had in the tournament
        - losses: the number of losses the deck had in the tournament
        - draws: the number of draws the deck had in the tournament
        - entries: the number of times this card was entered in a tournament under this commander
    For each unique commander or pair of commanders uniquely identified by their unique id or composite id for pairs, we will store the following statistics in the database:
        - wins: the total number of wins this commander has in all tournaments
        - losses: the total number of losses this commander had in all tournaments
        - draws: the total number of draws this commander had in all tournaments
        - entries: the number of times this commander was entered in a tournament
    For each unique card uniquely identified by its unique id, we will store the following statistics in the database:
        - id: the unique identifier of the card - from moxfield
        - name: the name of the card
        - scryfall_id: the scryfall id of the card that we can use to externally link to the card
    We will store the commander(s) and cards in the database following the final database structure below:
    
    The final data structure we will store in the database is as follows:
    Table: commanders
        Columns:
            - id: the unique identifier or composite unique identifier of the commander(s) of the deck
            - name: the name or names of the commander(s) separated by " + " if there are two commanders
            - wins: the total number of wins this commander has in all tournaments
            - losses: the total number of losses this commander had in all tournaments
            - draws: the total number of draws this commander had in all tournaments
            - entries: the number of times this commander was entered in a tournament
    Table: cards
        Columns:
            - uniqueCardId: the unique identifier of the card - This is the main identifier for the card
            - name: the name of the card
            - scryfall_id: the scryfall id of the card that we can use to externally link to the card
    Table: statistics
        Columns:
            - commander: the uniqueCardId or composite uniqueCardId of the commander(s) of the deck
            - card: the uniqueCardId of the card in the deck
            - wins: the number of wins the deck had in the tournament
            - losses: the number of losses the deck had in the tournament
            - draws: the number of draws the deck had in the tournament
            - entries: the number of times this card was entered in a tournament under this commander
    Using this commander-card many-to-many pairing, we can query the API to fetch statistics from the database. The key statistics we are targeting are as follows:
        - Win rate of a card in a deck
            - For commander X, what is the average win rate of all decks playing commander X?
            - For commander X, what is the average win rate of all decks playing commander X that include card Y?
            - What is the difference between these two values? +/-/= %?
        - Draw rate of a card in a deck
            - For commander X, what is the average draw rate of all decks playing commander X?
            - For commander X, what is the average draw rate of all decks playing commander X that include card Y?
            - What is the difference between these two values? +/-/= %?
        - Inclusion rate of a card in a deck
            - For commander X, how many decks playing commander X included card Y?


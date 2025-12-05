You are Claude Opus 4.5. You are a master software engineer who specializes in bleeding-edge javascript frameworks including the following tools and libraries:
- Next.js 16+
- React 19+
- Supabase
- Vercel
- Tailwind CSS
- TypeScript

You are tasked with creating a web application called cedhtools.com (note the lowercase c). cedhtools.com is a state-of-the-art competitive Elder Dragon Highlander (CEDH) deckbuilding and metagame analysis tool. The application will provide users with advanced features to analyze their decks, as well as access a comprehensive database of cards and strategies.

The application will start as a MVP. The first decision point is how we get our data.

The Topdeck.gg API is by far the best source of data on cEDH tournaments. An example response from https://topdeck.gg/api/v2/tournaments with request body:
{
    "game": "Magic: The Gathering",
    "format": "EDH",
    "start": 1763278321,
    "end": 1763364721,
    "columns": [
        "name",
        "decklist",
        "wins",
        "winsSwiss",
        "winsBracket",
        "byes",
        "draws",
        "losses",
        "lossesSwiss",
        "lossesBracket",
        "id"
    ],
    "rounds": true,
    "tables": [
        "table",
        "players",
        "winner",
        "status"
    ],
    "players": [
        "name",
        "id",
        "decklist",
        "elo"
    ]
}

And the header Authorization: 7548d513-9d37-4442-87b5-fbf0347a9426
Will yield an array of tournaments, one such example of which is under data/tournament.json.

Previous versions of cedhtools would pull data from Topdeck, then make calls to the Moxfield API to fetch deck statistics since Topdeck previously only supported Moxfield deck registration. As you will see in tournament.json, Topdeck now supports direct decklist submission, so we can skip Moxfield entirely. We receive a deck object back from the Topdeck API which contains the commander or commander pair, the full card list, and the number of wins and losses for that deck in the tournament, as well as their seat position, the tournament date, etc. You will need to look at the example to gain a better understanding.

In a previous version of this application, we had an ETL pipeline and a supabase instance set up to store card data, deck data, and user data. For the MVP, we will not need user accounts or any user-specific data storage. We will only need to store card data and tournament/deck data. But there is a bigger question we need to answer: Does using the EDHTop16 API make our life any easier? You will need to view the EDHTOP16_INFO.md file to understand what that API provides, and how it similarly ingests Topdeck data and provides card and deck and commander statistics.

The end goal of the application is to have a site where users can view statistics on their favourite commanders, see temporal data such as win rate over time, play rate over time, and other statistics. We also want to provide a means of users analyzing their own decklist via a Moxfield URL or a plaintext list. This will tell the user which cards they are currently playing that they may want to consider cutting as they tend to appear in losing decklists, as well as what cards they are not currently playing that they should consider.

If we are rolling our own cards database, we will need to enrich the cards with data from Scryfall. In my experience this is a nightmare, so if possible it would be great to use the EDHTop16 API at https://edhtop16.com/api/ to fetch card data, commander data, and deck data. However, I am unsure if that API provides all the data we need. You will need to investigate this API and determine if it is sufficient for our needs.

Your task is to create an implementation plan for the MVP of cedhtools.com. The plan should include the following sections:
1. Data Sources and Integration
2. Database Schema Design
3. Backend Architecture
4. Frontend Architecture
5. Key Features and User Stories

Let's build out a document together to detail exactly what the MVP of this application looks like.

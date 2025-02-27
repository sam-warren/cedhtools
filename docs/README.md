# General Knowledge

`Tournament`
- A `Tournament` is a competitive event where `Player`s compete.
- `Tournament`s are made up of `Round`s.
- `Round`s are made up of `Table`s.
- `Table`s are made up of `Player`s.
- Each `Player` registers and plays a `Deck` in the `Tournament`.
- When the `Tournament` is over, the `Standing`s are calculated.
- The `Standing`s are used to determine the `Player`s' final rankings.
- `Tournament`s generally all follow the same structure: Swiss rounds followed by a Top Cut.
- For the purposes of this application, all `Tournament`s follow the same game and format: Magic: The Gathering, Competitive Elder Dragon Highlander (CEDH).

`Player`
- A `Player` is a person who participates in a `Tournament`.
- A `Player` registers a `Deck` for the `Tournament`.
- A `Player` is assigned to a `Table` in each `Round`.
- A `Player` is ranked based on their `Standing` in the `Tournament`.

`Standing`
- A `Standing` is a `Player`'s rank in a `Tournament`.
- A `Standing` is used to determine the `Player`'s final ranking in the `Tournament` as well as their performance in each `Round` for the purposes of identifying which players proceed to the Top Cut.
- A `Standing` is calculated based on the `Player`'s performance in each `Round` - the number of points they have accumulated.
- Once Swiss rounds conclude and the remaining players proceed to the Top Cut, the `Standing` is used to determine the `Player`s' seeding in the Top Cut.

`Round`
- A `Round` is a stage in a `Tournament`.
- A `Round` is made up of `Table`s.
- A `Round` is played by all `Player`s in the `Tournament`, with the exception of top cut rounds.
- A Top Cut `Round` is played by a subset of `Player`s in the `Tournament` based on their `Standing`.
- Depending on tournament size, the Top Cut could be Top 40, Top 16, Top 10, Top 4, with many tournaments having multiple top cut rounds such as a Top 16 round where four tables of four players compete, with the winners of each of those tables moving on to the Top 4 round.
- Top cuts are determined based on a `Player`'s `Standing` in the `Tournament` at the end of the Swiss rounds.
- A Swiss round is a timed round in a tournament where all `Player`s who registered and play in the `Tournament` play against each other in a series of `Table`s.
- A tournament can have any number of Swiss rounds, but commonly have 4-6 Swiss rounds. The number of Swiss rounds is typically based on the `Tournament` size (the number of `Player`s in the `Tournament`) as well as the time allotted for the `Tournament`.
- A `Round` is played until all `Table`s have a winner, or the `Round` results in a draw.
- A `Draw` is typically reached either by time running out in a Swiss `Round`, or by an Intential Draw being agreed upon by all `Player`s at a `Table` in a Swiss `Round`. Intentional draws typically occur for political reasons, for example if all players are "locked" for the top cut (awarding each of them 1 point guarantees their placement in the top cut), or if a game state is reached in which one player could dramatically influence the result of the game by performing or not performing a specific action.
- An example of an Intential Draw secnario: `Player`s A, B, C, and D are playing in a Swiss `Round`. `Player` A is far behind, with `Player`s B and C poised to win. `Player B` puts a win on the stack with the intention to win the `Table`. `Player` A has a counterspell that could stop `Player` B's win attempt, but if they do, then `Player` C is guaranteed to win immediately after. In this situation, `Player` A offers an Intentional Draw to the `Table`, stating that if they stop `Player` B's win attempt, then `Player` C will win immediately after. `Player`s B, C, and D agree to the Intentional Draw, and the `Table` results in a draw, awarding each `Player` 1 point.
- When a `Player` is deemed the winner of a `Table`, 5 points are added to their `Standing`. If the `Table` results in a draw, 1 point is added to each `Player`'s `Standing`. Each `Player` at the `Table` who did not win is awarded 0 points for that `Round`.
- In a typical medium - large `Tournament`, say with 64 `Player`s, the `Tournament` would have 6 Swiss `Round`s where each `Player` is assigned to one of 16 `Table`s in each `Round`. After the Swiss `Round`s are completed, the top 16 `Player`s in the `Standing`s would move on to the Top 16 `Round`, where they would be assigned to 4 `Table`s of 4 `Player`s each. The remaining 48 `Player`s would be eliminated from the `Tournament` after the last round of `Swiss` play. The winners of each of the 4 `Table`s in the Top 16 `Round` would move on to the Top 4 `Round`, where they would be assigned to 1 `Table` of 4 `Player`s. The winner of that `Table` would be the winner of the `Tournament`.
- Sometimes, in unevenly numbered `Tournament`s, a Bye will be issued to a `Player`. If a player receives a Bye for a `Round`, they do not play in that `Round`, and are awarded 5 points for that round. Byes are issued in an attempt to ensure each `Table` in each `Round` has exactly 4 `Player`s.

`Table`
- A `Table` is a group of typically 4 `Player`s in a `Round`.
- A `Table` is made up of `Player`s.
- A `Table` is played until a winner is determined.
- A `Table` can sometimes consist of fewer than or greater than 4 `Player`s, depending on the `Round` and the `Tournament` structure in certain edge cases.

`Deck`
- A `Deck` is a collection of exactly 100 `Card`s across the `Commanders`, `Mainboard` and `Companions` `Board`s that a `Player` uses in a `Tournament`.
- The total number of `Card`s in a `Deck`'s `Commanders`, `Mainboard`, and `Companions` `Board`s must be exactly 100, no more, no less.
- A `Deck` is registered by a `Player` for a `Tournament`.
- A `Deck` is a physical collection of `Card`s.
- A `Deck` is comprised of `Board`s.
- Each `Card` in each `Board` of a `Deck` must be unique, with the explicit exception of Basic Land cards (a special type of land) and any card that explicitly states more than one copy can exist in a deck, for example: "Relentless Rats", which has the following in the oracle text: "A deck can have any number of cards named Relentless Rats."
- Each `Card` in the `Mainboard` and `Companions` `Board` of a deck must adhere to the commander color identity rules. `Card`s in these `Board`s must have a color identity that is a subset of the combined color identity of the `Card` or `Card`s in the `Commanders` `Board`.
- For example, if a `Deck` has the `Card`s "Thrasios, Triton Hero" and "Vial Smasher the Fierce" in the `Commanders` `Board`, the `Deck`'s color identity is Blue, Green, Red, and Black. The `Mainboard` and `Companions` `Board` of the `Deck` must only contain `Card`s that have a color identity that is Blue, Green, Red, and/or Black. The deck cannot have any `Card`s that have White in the color identity.

`Board`
- A `Board` is a collection of `Card`s that make up a section of a `Deck`.
- There are five main types of `Board`s: `Commanders`, `Mainboard`, `Sideboard`, `Maybeboard`, and `Companions`.
- Only `Commanders`, `Companions`, and `Mainboard` are actually played in a `Deck` in a `Tournament`.
- `Maybeboard` and `Sideboard` are organizational tools `Players` can use in the deckbuilding process to help them build their `Deck` before the `Tournament`.
- `Players` only actually register and play the cards in the `Commanders`, `Companions`, and `Mainboard` `Board`s in the `Tournament`, these are the only `Board`s that contribute to a deck's performance.
- The `Commanders` `Board` can only consist of one or two `Card`s. These `Card`s are the `Commander` of the `Deck` for aggregation purposes when defining a `Commander`. Some `Cards` played as `Commanders` are printed with "Partner" indicating the `Deck` can have two cards in the `Commanders` `Board`.
- The `Companions` `Board` can only consist of up to one `Card`. Companions are entirely optional to play. This `Card` starts in a special zone like the cards in the `Commanders` `Board` and is considered part of the `Deck` for aggregation purposes when defining a `Commander`.
- The `Mainboard` `Board` is the main part of the `Deck` that is played in the `Tournament`. It consists of 97 - 99 `Card`s, depending on the number of cards in the `Commanders` and `Companions` `Board`s.
- The `Mainboard` `Board` is shuffled face-down and drawn from during the game, while the `Card`s in the `Commanders` `Board` start face-up in the Command Zone, and the `Card` in the `Companions` `Board` starts in the Sideboard, if it is included.
- A `Card` in the `Companions` `Board` can be put into a player's hand for {3} (3 colorless mana) exactly once per game. If this card is put into the graveyard, a hand, or the exile zone, or any other zone besides the battlefield it will stay there.
- A `Card` in the `Commanders` `Board`, on the other hand, has special rules. It can be cast from the Command Zone for its mana cost, plus an additional {2} (2 colorless mana) for each time it has been cast from the Command Zone this game. If a `Card` in the `Commanders` `Board` would be put into the graveyard, into a hand, or the exile zone, it can be put back into the Command Zone instead.
- A `Deck` must have a `Commanders` `Board` and a `Mainboard` `Board` to be registered for a `Tournament`. A `Deck` can optionally have a `Companions` `Board`.
- A `Deck` may only register two `Card`s in the `Commanders` `Board`, if both `Card`s have the "Partner" keyword. If a `Deck` has a `Card` with the "Partner" keyword in the `Commanders` `Board`, it may or may not have another `Card` with the "Partner" keyword in the `Commanders` `Board`.
- All `Card`s in the `Commanders` board must be a Legendary Creature type, or explicitly state that the card can be played as a commander.
- For example, a `Player` can register a `Deck` with "Tymna the Weaver" and "Jeska, Thrice Reborn". Both of these `Card`s have the "Partner" keyword, and while "Jeska, Thrice Reborn" is a Legendary Planeswalker, it has the text "This card can be your commander." in the rules text, so it can be played as a commander. 
- Another example of this is "Shorikai, Genesis Engine" which has the type "Legendary Artifact - Vehicle". Although it is not a creature, it has the text "Shorikai, Genesis Engine can be your commander." in the rules text, so it can be played as a commander.

`Card`
- A `Card` is a physical game piece that is used in a `Deck`.
- A `Card` has properties that define it such as name, id, type, oracle text, mana cost, etc.
- A `Card` has a color identity that is used to determine if it can be played in a `Deck` based on the color identity of the `Commanders` `Board`.
- A `Card`'s color identity is different from its color: A `Card`'s color is based off its casting cost (mana cost) only, while a `Card`'s color identity is based off its casting cost and any mana symbols in its rules text.
- This is important because a `Card`'s color identity is used to determine if it can be played in a `Deck` based on the color identity of the `Commanders` `Board`.

`Commander`
- A `Commander`, in this context, is not so much a physical entity but rather a metaphysical aggregation of `Deck`s that played with a specific `Card` or two `Card`s in the `Commanders` `Board` of the `Deck`.
- A `Commander` is a representative of all `Deck`s that are played with the same `Card` or two `Card`s in the `Commanders` `Board` of the deck, registered by all `Player`s in all `Tournament`s.
- A `Commander` can represent one or two physical cards, depending on the `Card`s in the `Commanders` `Board` of the `Deck`. These two cards uniquely identify the `Commander` for aggregation purposes.
- A single `Card` can be a `Commander` on its own, or it can be a `Commander` with another `Card` if it has the "Partner" keyword.
- For the purposes of uniquely identifying a `Commander`, take the following for example:
  - `Player` A registers a `Deck` with the `Card`s "Thrasios, Triton Hero" and "Vial Smasher the Fierce" in the `Commanders` `Board`.
  - `Player` B registers a `Deck` with the `Card`s "Vial Smasher the Fierce" and "Thrasios, Triton Hero" in the `Commanders` `Board`.
  - In this case, the `Commander` is "Thrasios, Triton Hero" and "Vial Smasher the Fierce" as a pair, not just "Thrasios, Triton Hero" or "Vial Smasher the Fierce" on their own.
  - Regardless of the order of the `Card`s in the `Commanders` `Board`, the `Commander` is always identified as "Thrasios, Triton Hero" and "Vial Smasher the Fierce" as a pair.
  - `Player` C registers a `Deck` with the `Card` "Thrasios, Triton Hero" in the `Commanders` `Board`.
  - In this case, the `Commander` is "Thrasios, Triton Hero" on its own. It has completely different statistics than the `Commander` "Thrasios, Triton Hero" and "Vial Smasher the Fierce" as a pair.
  - `Player` D registers a `Deck` with the `Card`s "Thrasios, Triton Hero" and "Tymna the Weaver"  in the `Commanders` `Board`.
  - In this case, the `Commander` is "Thrasios, Triton Hero" and "Tymna the Weaver" as a pair. It has completely different statistics than the `Commander` "Thrasios, Triton Hero" and "Vial Smasher the Fierce" as a pair.
- Since a `Deck` with a `Card` in the `Companions` `Board` indicates special deck-building restrictions, we factor this into the notion of a `Commander`. For example, although "Jenson Carthalion, Druid Exile" is a `Card` that is often registered in the `Commanders` `Board` of a deck, and does not have the "Partner" keyword, it is often used in combination with the Companion "Lurrus of the Dream-Den". In this case, the `Commander` is "Jenson Carthalion, Druid Exile" and "Lurrus of the Dream-Den" as a pair, not just "Jenson Carthalion, Druid Exile" on its own. We make this distinction to ensure that the `Commander` statistics are accurate and reflect the actual `Deck` building restrictions of the `Deck`.


--- All of the above information has been refined and is correct. All of the below is a work in progress that you may contribute to. You may not modify anything above this line. ---
### Conversion Rate
https://www.reddit.com/r/CompetitiveEDH/comments/17w5exx/edhtop16_conversion_rates_have_a_mathematical/
The conversion rates as displayed on edhtop16 are nice and easy to read, but they have a fundamental mathematical flaw and can therefore be misleading. I want to introduce the ‘conversion factor’, that hopes to address this problem. I have nothing but respect for Eminence and their data transparency without which none of this would even be possible. Only their constant hard work allows me to hyper fixate on data analysis to this degree. So this is less a critique of what they do, but more of a extension or maybe even a feature request :P

Imagine two commanders: Commander A entered 2 tournaments and made top 16 in one of them. Commander B also entered two tournaments and made top 16 in one of them. Both would have a ‘conversion rate’ of 1/2 = 50%, which suggests they are equally good in reaching top 16. But now let's say the two tournaments Commander A entered were 128 player events and the two tournaments Commander B entered were 64 player events. Now Commander A's performance seems to be the bigger accomplishment, but the conversion rate is not able to reflect that. If tournaments of different sizes get clumped together, the result can be a blurry mess that loses some meaning.

Let's introduce the ‘conversion factor’, that reflects how much more a certain commander makes top 16 in comparison to how often it should on average, given the tournaments it attended. Basically, actual performance (P) over theoretical expectation (E).

For a single 128 player event a single commander has an expected chance of 16/128 = 12.5% of making top 16. Or in other words, out of the 1 commander we expect 0.125 to be in top 16. In practice the result can only have discrete values (0, 1, 2, …) of course. If it makes Top16 (i.e. a result of 1), it has exceeded this expectation by a factor of 1/0.125=8. If there would be 16 of the same commander in the same tournament, on average we would expect 16 * 16/128 = 2 of them in top 16. Everything above that has exceeded expectation, everything below that would not meet the expectation.

For multiple tournaments of arbitrary size, we simply add up all the expectations and all the actual performances and then divide performance by expectation. So in our example above Commander A has a performance of 1 and the expectation was 2 * 16/128 = 0.25 -> conversion factor of 1/0.25 = 4. Commander B also has a performance of 1, but an expectation of 2 * 16/64 = 0.5 -> conversion factor of 1/0.5 = 2. This is now able to properly reflect performances across multiple tournaments of different sizes. Let's say Commander C attended all four of these tournaments and made top 16 in one of the 128 and one of the 64 player events. So a performance of 2. And an expectation of 2 * 16/128 + 2 * 16/64 = 0.25 + 0.5 = 0.75 -> conversion factor of 2/0.75 = 2.67. Somewhere between A and B, which I think makes sense.

Equipped with that knowledge, let’s take a look at some real-world data from edhtop16 from the last 180 days, which I deem to be a reasonable time frame in order get enough data and also respect shifts in the meta. If no further filters would be applied, as you expect the top of the list will be dominated by one ofs that had a single entry and made top16 with that. Just for fun these are (numbers rounded):


commander	entries	P	E	conversion_factor
Solphim, Mayhem Dominus	1	1	0.16	6.25
Hurkyl, Master Wizard	1	1	0.17	5.75
Rashmi, Eternities Crafter	1	1	0.20	4.94
Oskar, Rubbish Reclaimer	4	3	0.79	3.81
Anhelo, the Painter	2	2	0.55	3.66
P: performance, i.e. number of actual top16's; E: expected number of top16's based on attended tournaments

If we apply some reasonable filters like a minimum of 20 entries, we get this top 20 commanders sorted by conversion factor:

commander	entries	P	E	conversion_factor
Kraum, Ludevic's Opus / Tevesh Szat, Doom of Fools	45	20	11.00	1.82
Thrasios, Triton Hero / Vial Smasher the Fierce	25	12	6.89	1.74
Dargo, the Shipwrecker / Tymna the Weaver	28	10	6.21	1.61
Dihada, Binder of Wills	51	16	10.14	1.58
Kenrith, the Returned King	87	31	20.03	1.55
Sisay, Weatherlight Captain	167	58	37.86	1.53
Kraum, Ludevic's Opus / Tymna the Weaver	355	127	83.14	1.53
Inalla, Archmage Ritualist	24	10	6.59	1.52
Malcolm, Keen-Eyed Navigator / Tymna the Weaver	43	14	9.99	1.40
Rograkh, Son of Rohgahh / Silas Renn, Seeker Adept	128	35	26.05	1.34
Niv-Mizzet, Parun	52	16	11.93	1.34
Tivit, Seller of Secrets	256	76	59.88	1.27
Kinnan, Bonder Prodigy	240	73	58.12	1.26
Malcolm, Keen-Eyed Navigator / Vial Smasher the Fierce	54	21	16.77	1.25
Atraxa, Grand Unifier	158	44	35.60	1.24
Bruse Tarl, Boorish Herder / Thrasios, Triton Hero	97	31	25.31	1.22
Elsha of the Infinite	26	7	5.74	1.22
Kediss, Emberclaw Familiar / Malcolm, Keen-Eyed Navigator	25	7	5.86	1.20
Shalai and Hallar	23	8	6.89	1.16
Najeela, the Blade-Blossom	244	63	54.57	1.15

Only one last thing: what about statistical significance? Yeah ... uhh? If we create 95% confidence intervals for these numbers, the first place (Kraum/Tevesh in this case) can statistically not be separated from the next 34 commanders in this ranking. The same is true for Kraum/Tymna even though their confidence interval is more narrow. So in that regard the whole top 20 shown here is statistically speaking one cluster.

I plan to somewhat regularly update this either here or on twitter and already have plans for extensions, but this post is already long enough.

https://github.com/EDH-Top-16/edhtop16/issues/29
Is your feature request related to a problem? Please describe.
Conversion rate is a rather flawed statistic in that it values tops of all tournament sizes equally; conversion score is an attempt to fix this; credit to datatog for finding this

Conversion Rate is topCuts / tournaments
Conversion Score is calculated as follows:

Calculate the 'weight' of each tournament on the assumption that your chances of making top cut are equal to all competitors - this is sum(topCut/tournamentSize); call this expectedTops
Your conversion score is then topCuts/expectedTops - anything above 1 is better than expected; anything below is worse than expected
I like it multiplied by 100 so it resembles plus-statistics in baseball like wRC+, OPS+ (even though 100 is not average, rather it's expected)
Describe the solution you'd like

Instead of conversion rate, display conversion score by default and include a toggle to old CR (or not - if it's flawed, do we even want to display it?)

Additional context
https://github.com/EDH-Top-16/edhtop16/pull/28#issue-1995984792
export const conversionRate(commander, listOfEntries){
    let actual = 0;
    let expected = 0; 
    listOfEntries.filter(el => el.commander === commander).forEach((entry) => {
        expected += entry.topCut / entry.tournamentSize;
        if(entry.standing >= entry.topCut) actual++;
    })
    return actual/expected * 100;
}

### Glicko Rating
From chess.com: 
- https://support.chess.com/en/articles/8724787-how-do-ratings-work-in-4-player-chess
- https://support.chess.com/en/articles/8566476-how-do-ratings-work-on-chess-com
- https://www.chess.com/article/view/chess-ratings---how-they-work

How do ratings work in 4 Player Chess?
Chess.com uses the Glicko-2 rating system for 4 Player Chess (4PC), similar to regular chess. However, because you’re playing against multiple opponents instead of just one, the rating calculations work a bit differently.

Free For All
In Free For All mode, your rating is adjusted based on the average rating of your three opponents.

For example, if the players in a game have ratings of 1500, 1600, 1700, and 1800, the 1500-rated player’s rating change would be calculated as if they were playing against a 1700-rated opponent (the average of 1600, 1700, and 1800). Meanwhile, the 1800-rated player’s rating change would be calculated as if they were playing against a 1600-rated opponent (the average of 1500, 1600, and 1700).

The rating adjustment also varies depending on your placement in the game:
1st place: Your rating is adjusted as if you won three games against the calculated rating.
2nd place: Your rating is adjusted as if you won two games and lost one game against the calculated rating.
3rd place: Your rating is adjusted as if you won one game and lost two games against the calculated rating.
4th place: Your rating is adjusted as if you lost three games.

Teams
In Teams mode, the rating adjustment is calculated similarly to a 1v1 game, but with a slight difference in how team ratings are determined — Instead of simply averaging the ratings of the two team members, the team rating is weighted toward the higher-rated player. 

The formula used is:

(2H+1L)/3

Where H is the higher rating and L is the lower rating.
For example, if Team A consists of players rated 1800 and 1300, and Team B consists of players rated 1500 and 1600, the rating adjustment would be calculated as if a 1633-rated player (Team A) played against a 1566-rated player (Team B).

### Application Pages and Views

Data filtering is available on ALL applications and views via the filtering functionality in the sidebar. The sidebar filters are consistent across all pages and views, and allow users to filter data by date range, player, commander, and tournament at any time, on any page, and see the updated data reflected.

The filters are as follows:
- Date Range - Allows users to filter data by date range. The default date range is "Post Ban" - September 23, 2024 - Present.
- Top Cut - Allows users to filter data by the top cut of the tournament the data originates from - Top 4, Top 10, Top 16, Top 40, or All. Default is Top 16, Top 4, Top 10.
- Tournament Size - Allows users to filter data by the size of the tournament (number of entries) that the data originates from. Default is 30+ (players).

#### `/` - Dashboard page (content TBD, likely a configurable widget grid for users to customize their favourite statistics / tables / charts)

#### `/tournaments` - List of all tournaments
- Contains stat cards that show key statistics about tournaments:
  - Total Tournaments
  - Total Games Played
- Contains a table of all tournaments, paginated from the API. The table columns are as follows:
  - Tournament Name - linked to the Tournament page
  - Date
  - Swiss Rounds
  - Top Cut
  - Entries
  - Winning Player - linked to the Player page for the winner
  - Winning Deck - linked to the Deck page for the winning deck
  - Winning Commander - linked to the Commander page for the winning commander
- Contains charts with the following data:
  - Tournament Participation over Time - How many people registered for tournaments each month?

#### `/tournaments/:id` - Details of a specific tournament
- Contains stat cards that show key statistics about the specific tournament:
  - Date
  - Tournament Size
  - Top Cut
  - Entries
  - Winning Player
  - Winning Deck
  - Winning Commander
- Contains a table of the standings for the tournament, paginated from the API. The columns for this table are as follows:
  - Player Name - linked to the Player page if a player has a `pid`
  - Standing (A number from 1 to {tournament size})
  - Wins
  - Losses
  - Draws
  - Points
  - Byes
  - Deck - A link to the Deck page for the deck the player played in the tournament
  - Commander - A link to the Commander page for the commander the player played in the tournament
- Contains charts with the following data:
  - Pie chart of commander meta breakdown for this tournament
  - Bar chart of color identity breakdown for this tournament - based on the color identity of the commanders played in the tournament
  - Bar chart of win rate by seat position in this tournament - aggregated across all rounds (Seat 1, Seat 2, Seat 3, Seat 4)

#### `/players` - List of all players
Note that players who have guest accounts in topdeck.gg (which we do not have records for, as they do not have a `pid`) will not be included in this list.
- Contains stat cards that show key statistics about players overall:
  - Number of unique players
  - Total Tournament Entries

- Contains a table of all players, paginated from the API. The table columns are as follows:
  - Player Name - linked to the Player page
  - Tournament Entries - the number of tournaments the player has entered
  - Games Played - the number of games the player has played
  - Wins - the number of games the player has won
  - Losses - the number of games the player has lost
  - Draws - the number of games the player has drawn
  - Byes - the number of byes the player has received
  - Win Rate - the percentage of games the player has won
  - Glicko Rating - the player's Glicko rating


#### `/players/:id` - Details of a specific player
- Contains stat cards that show key statistics about the player overall:
  - Tournament Entries
  - Games Played
  - Unique Commanders Played
  - Wins
  - Losses
  - Draws
  - Byes
  - Tournament Wins
  - Top 4s
  - Top 10s
  - Top 16s
  - Conversion Rate
  - Win Rate
  - Draw Rate
  - Glicko Rating
  - First Seen - the date the player was first seen in the data
  - Last Seen - the date the player was last seen in the data
- Contains a table of tournament history for the player, showing all tournaments they have played in, their standing, and their performance in each tournament, paginated from the API.The columns for this table are as follows:
  - Tournament Date
  - Tournament Name - linked to the Tournament page
  - Player Standing (ex. 2/64) - combined with the tournament size
  - Wins
  - Draws
  - Losses
  - Points
  - Deck - A link to the Deck page for the deck the player played in the tournament
  - Commander - A link to the Commander page for the commander the player played in the tournament 
- Contains a table of all commanders the player has played in tournaments, showing the player's performance with each commander. The columns for this table are as follows:
  - Commander Name - linked to the Commander page
  - Tournament Entries
  - Games Played
  - Wins
  - Losses
  - Draws
  - Byes
  - Win Rate
- Contains charts with the following data:
  - Tournament Participation over Time - A line chart showing the number of tournaments the player has played in on a monthly basis
  - Win Rate over time - A line chart showing the player's overall win rate over time
  - Commander Performance - A bar chart showing the player's win rate with each commander they have played over time

#### `/commanders` - List of all commanders
- Contains stat cards that show key statistics about commanders overall:
  - Number of unique commanders
  - (open to suggestions)
- Contains a table of all commanders, paginated from the API. The table columns are as follows:
  - Commander Name - linked to the Commander page
  - Number of tournament entires with this commander
  - Tournament Wins
  - Top 4s
  - Top 10s
  - Top 16s
  - Conversion Rate
  - Average Win Rate
  - Meta Share - the percentage of entries in tournaments that this commander represents
- Contains charts with the following data:
  - Commander Meta Breakdown - A pie chart showing the breakdown of commanders played in tournaments (with an "Other" category for commanders with less than 1% of the meta)


#### `/commanders/:id` - Details of a specific commander
- Contains stat cards that show key statistics about the commander overall:
  - Number of tournament entries with this commander
  - Tournament Wins
  - Top 4s
  - Top 10s
  - Top 16s
  - Conversion Rate
  - Average Win Rate
  - Meta Share - the percentage of entries in tournaments that this commander represents
- Contains a button that links to /commanders/:id/cards - "View Card Performance"
- Contains a table of top players with this commander, showing the player's performance with this commander, paginated from the API. The columns for this table are as follows:
  - Player Name - linked to the Player page
  - Tournament Entries
  - Games Played
  - Wins
  - Losses
  - Draws
  - Win Rate
  - Conversion Rate
  - Glicko Rating
- Contains a table of top performing decklists with this commander, showing the deck's performance in tournaments, paginated from the API. The columns for this table are as follows:
  - Deck Name - linked to the Deck page
  - Player Name - linked to the Player page
  - Tournament Date
  - Tournament Name - linked to the Tournament page
  - Standing (ex. 2/64) - combined with the tournament size
  - Wins
  - Losses
  - Draws
  - Byes
  - Points
  - An "Actions" column with a button to "View deck on Moxfield" - this button links to the decklist on Moxfield
- Contains charts with the following data:
  - Commander Win Rate over Time - A line chart showing the commander's win rate over time
  - Commander entries over time - A line chart showing the number of times the commander has been played in tournaments over time
  - Win Rate by Seat Position - A bar chart showing the win rate of the commander by seat position in tables in rounds in tournaments (Seat 1, Seat 2, Seat 3, Seat 4)
  - Win Rate by Top Cut - A bar chart showing the win rate of the commander in each of the following types of rounds: Swiss, Top 16, Top 10, Top 4

#### `/commanders/:id/cards` - Details of a specific commander's cards
- Contains stat cards that show key statistics about the commander's cards overall:
  - Number of unique cards
- Contains a series of tables, each split by Card Type (Battle, Planeswalker, Creature, Sorcery, Instant, Artifact, Enchantment, Land) - one table for each - of all cards played with this commander, paginated from the API. The table columns for each table are as follows:
  - Mana Cost - the mana cost of the card
  - Card Name - linked to the /commanders/:id/cards/:id page
  - Type Line - the type line of the card
  - Inclusion Rate - the percentage of decks with this commander that include this card
  - Win Rate - the win rate of decks with this commander that include this card (compared to the win rate of all decks - how does this card affect the win rate of decks with this commander?)
- Contains charts with the following data:
  - Staple vs. Synergy score - A radial chart showing the ratio of "Staple" cards to "Synergy" cards - staple cards are card that are played in most decks they can be played in, while synergy cards are cards that are played in decks that are built around them. This chart shows the balance of staple to synergy cards in decks with this commander. Still unsure of how to implement this but this is the documentation on edhrec.com:

  > What is "Synergy"? What is the "Signature Cards" section?
  > Many cards across EDHREC will have a rating of synergy that will show up as a percentage that either has a + or a - in front of it. For example, this Eldrazi Displacer has a +75% synergy rating on the Rasputin Dreamweaver page.

  > Synergy rating is intended to show cards that are particularly important to the commander or theme you are currently viewing. This is opposed to just cards that are generally played in most decks that are popular because they are individually strong. We did this because we wanted to show what cards were interesting to a commander in the Signature Cards section at the top of the page. It gives a quick look at what cards define a deck, as opposed to just showing a bunch of cards like Cyclonic Rift and Sol Ring that aren’t interesting because they are in a bunch of decks.

  > Synergy score is calculated as: (% decks this card is in for commander/theme) - (% decks this card is in for color identity)

  > In the Eldrazi Displacer and Rasputin Dreamweaver example, a +75% synergy score means that it’s seen way more than in other U/W decks. It’s calculated by taking the 86% of Rasputin decks it is in, then subtracting the 11% of other U/W decks it is in. Leaving us +75% synergy score, making it pretty clear this card is not generally popular in most U/W decks but particularly popular in Rasputin decks.

#### `/commanders/:id/cards/:id` - Details of a specific commander's card
- Contains stat cards that show key statistics about the commander's card overall:
  - Number of unique decks that play this card
  - Inclusion Rate
  - Win Rate of this card when played with this commander - plus a badge showing + or - how this compares to the commander's overall win rate with and without this card
- Contains a table of recent top performing decklists that include this card, paginated from the API. The columns for this table are as follows:
  - Deck Name - linked to the Deck page
  - Player Name - linked to the Player page
  - Tournament Date
  - Tournament Name - linked to the Tournament page
  - Standing (ex. 2/64) - combined with the tournament size
  - Wins
  - Losses
  - Draws
  - Byes
  - Points
  - An "Actions" column with a button to "View deck on Moxfield" - this button links to the decklist on Moxfield
- Contains charts with the following data:
  - Win Rate over Time - A line chart showing the card's win rate over time when used with this commander
  - Inclusion Rate over Time - A line chart showing the card's inclusion rate in decks over time when used with this commander
  - Win Rate by Seat Position - A bar chart showing the win rate of the card by seat position in tables in rounds in tournaments (Seat 1, Seat 2, Seat 3, Seat 4) when used with this commander
  - Win Rate by Top Cut - A bar chart showing the win rate of the card in each of the following types of rounds: Swiss, Top 16, Top 10, Top 4 when used with this commander


#### `/decks` - List of all decks
- Contains stat cards that show key statistics about decks overall:
  - Number of unique decks
  - (open to suggestions)
- Contains a table of all decks, paginated from the API. The table columns are as follows:
  - Deck Name - linked to the Deck page
  - Commander Name - linked to the Commander page
  - An Actions column with a button to "View deck on Moxfield" - this button links to the decklist on Moxfield
  - Number of tournament entries with deck
  - Tournament Wins with deck
  - Top 4s with deck
  - Top 10s with deck
  - Top 16s with deck
  - Conversion Rate of Deck
  - Played By (since a deck can be played by multiple players, this column will show the player who played this deck most) - links to the Player page if a player has a `pid`

#### `/decks/:id` - Details of a specific deck
Note that the ID comes from an external Moxfield decklist ID.
- Contains stat cards that show key statistics about the deck overall:
  - Number of tournament entries with deck
  - Tournament Wins with deck
  - Top 4s with deck
  - Top 10s with deck
  - Top 16s with deck
  - Conversion Rate of Deck
  - Played By (since a deck can be played by multiple players, this card will show the player who played this deck most) - links to the Player page if a player has a `pid`
- Contains a series of tables separated by card type (Battle, Planeswalker, Creature, Sorcery, Instant, Artifact, Enchantment, Land) of all cards in the deck, paginated from the API. The columns for each table are as follows:
  - Mana Cost - the mana cost of the card
  - Card Name - linked to the /commanders/:id/cards/:id page
  - Type Line - the type line of the card
  - Inclusion Rate - the percentage of decks with this commander that include this card
  - Win Rate - the win rate of decks with this commander that include this card (compared to the win rate of all decks - how does this card affect the win rate of decks with this commander?)

The following data is ingested, aggregated, and calculated for the purposes of this application in the black box that is the ETL pipeline and API:

### Tournaments
API Requests:
- /api/tournaments - Get all tournaments
- /api/tournaments/(tid) - Get details and stats for a specific tournament
- /api/commanders/(cid)/tournaments - Get all tournaments a commander has been played in

- tid: The unique identifier for the `Tournament`, received from Topdeck.gg
- name: The name of the `Tournament`
- date: The date the `Tournament` took place
- swiss_rounds: The number of Swiss `Round`s in the `Tournament`
- top_cut: The first `Round` of the Top Cut in the `Tournament` - for example, "Top 16". Note that while a `Tournament` may have multiple Top Cut `Round`s, only the first `Round` is recorded here (e.g. "Top 16" will have a "Top 4" `Round` following it, but for the purposes of `Tournament` classification, this is `Tournament` has a top_cut of 16).
- entries: The number of `Player`s who entered the `Tournament`
- winner: The `Player` who won the `Tournament`
- standings: A list of `Standing`s in the `Tournament`
- rounds: A list of `Round`s in the `Tournament`

### Standings
API Requests: 
- /api/tournaments/(tid)/standings - Get all standings for a tournament
- /api/tournaments/(tid)/standings/player(pid) - Get a player's standing in a tournament
- /api/commanders/(cid)/standings - Get all standings for a commander

Standings are uniquely identified by the `Player` and the `Tournament` they are in.
- player: The `Player` in the `Standing`
- tournament: The `Tournament` the `Player` is in
- points: The number of points the `Player` has accumulated in the `Tournament`
- rank: The `Player`'s rank in the `Tournament`
- wins: The number of games the `Player` has won in the `Tournament`
- losses: The number of games the `Player` has lost in the `Tournament`
- draws: The number of games the `Player` has drawn in the `Tournament`
- wins_swiss: The number of games the `Player` has won in the Swiss `Round`s of the `Tournament`
- losses_swiss: The number of games the `Player` has lost in the Swiss `Round`s of the `Tournament`
- draws_swiss: The number of games the `Player` has drawn in the Swiss `Round`s of the `Tournament`
- wins_top_cut: The number of games the `Player` has won in the Top Cut `Round`s of the `Tournament`
- losses_top_cut: The number of games the `Player` has lost in the Top Cut `Round`s of the `Tournament`
- draws_top_cut: The number of games the `Player` has drawn in the Top Cut `Round`s of the `Tournament`
- byes: The number of byes the `Player` has received in the `Tournament`

### Players
API Requests:
- /api/players - Get all players
- /api/players/(pid) - Get details and stats for a specific player
- /api/players/(pid)/tournaments - Get all tournaments a player has played in
- /api/players/(pid)/standings - Get all standings for a player
- /api/players/(pid)/decks - Get all decks a player entered into tournaments
- /api/players/(pid)/commanders - Get all commanders a player has entered into tournaments with aggregated commander data

- pid: The unique identifier for the `Player`, received from Topdeck.gg
  - Note that some `Player`s in `Tournament`s may not have a `pid` if they are not registered on Topdeck.gg - this activity is supported by Topdeck.gg but is a limitation for the application.
  - When we display `Player` information in the application, for example in `Tournament` `Standing`s, we will simply display their name, which is guaranteed to exist, but we will not link to a `Player` profile in the application in the case the `Player` does not have a `pid`.
- name: The name of the `Player`
- games: The number of games (`Table`s) the `Player` has played in `Tournament`s
- wins: The number of games (`Table`s) the `Player` has won in `Tournament`s
- losses: The number of games (`Table`s) the `Player` has lost in `Tournament`s
- draws: The number of games (`Table`s) the `Player` has drawn in `Tournament`s
- byes: The number of byes the `Player` has received in `Tournament`s
- glicko: The current Glicko rating of the `Player` - this is a property that we compute when we ingest data from Topdeck.gg based on the player's performance. Each time a player plays in a tournament, that player's Glicko rating is added to the `Player`'s Glicko rating history, which we track over time as the same `Player` plays in more `Tournament`s.
- entries: The number of `Tournament`s the `Player` has entered
- tournament_wins: The number of `Tournament`s the `Player` has won
- top_16s: The number of `Tournament`s the `Player` has made Top 16 in
- top_10s: The number of `Tournament`s the `Player` has made Top 10 in
- top_4s: The number of `Tournament`s the `Player` has made Top 4 in
- glicko_history: A list of the `Player`'s Glicko rating history as they have played in `Tournament`s
- entry_history: A `TimeSeries` of the `Player`'s entries in `Tournament`s over time
- winrate_history: A `TimeSeries` of the `Player`'s winrate over time

### Commanders
API Requests:
- /api/commanders - Get all commanders
- /api/commanders/(cid) - Get details and stats for a specific commander
- /api/commanders/(cid)/tournaments - Get all tournaments a commander has been played in
- /api/commanders/(cid)/standings - Get all standings for a commander
- /api/commanders/(cid)/players - Get all players who have played a commander

# Application Structure
The cedhtools (all lowercase) application is comprised of the following components:
- app (@app) - The frontend of the application, built with Next.js 15, shadcn, TailwindCss, and Typescript.
- users_db: The database that stores user information, including authentication and authorization data - this is a PostgreSQL database that is called by the services in the @app/src/api directory. It is configured to use Prisma ORM.
- data_db: The database where all cedhtools data is stored. This is a TimescaleDB database that is called by a FastAPI API in the @api directory. This is a work-in-progress.
- api (@api): The backend of the application, built with FastAPI. This API is responsible for serving data from the data_db to the @app frontend. It is a work-in-progress. It is not responsible for ingesting data from Topdeck.gg, that is done by the ingestor.
- etl (@etl): The ETL (Extract, Transform, Load) process for ingesting data from Topdeck.gg and Moxfield and loading it into the data_db. This is a work-in-progress.
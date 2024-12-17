# cedhtools_backend/api/views/commander_statistics.py

from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from scipy.stats import chi2_contingency
import numpy as np
from collections import defaultdict
from datetime import datetime, timezone
from cedhtools_backend.models import (
    TopdeckTournament,
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldBoardCard
)
from ..serializers import CommanderStatisticsResponseSerializer
from cedhtools_backend.utilities.utilities import (
    create_success_response,
    create_error_response,
    date_str_to_unix_timestamp,
    unix_timestamp_to_date
)

import logging

# Configure logger
logger = logging.getLogger('cedhtools_backend')


class CommanderStatisticsView(APIView):
    """
    API endpoint to retrieve commander and card statistics based on filters.
    Supports querying one or two commanders (partner pairs).
    """

    def get(self, request, format=None):
        # Extract query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        tournament_size = request.query_params.get('tournament_size')
        commander_unique_card_ids = request.query_params.getlist(
            'commander_unique_card_id')

        # Validate number of commanders
        if not commander_unique_card_ids:
            return Response(
                create_error_response(
                    "At least one commander_unique_card_id parameter is required.", 400),
                status=400
            )
        if len(commander_unique_card_ids) > 2:
            return Response(
                create_error_response(
                    "A maximum of two commander_unique_card_id parameters are allowed.", 400),
                status=400
            )
        if len(commander_unique_card_ids) != len(set(commander_unique_card_ids)):
            return Response(
                create_error_response(
                    "Duplicate commander_unique_card_id parameters are not allowed.", 400),
                status=400
            )

        # Validate and parse dates
        try:
            if not start_date_str:
                return Response(
                    create_error_response(
                        "start_date parameter is required.", 400),
                    status=400
                )
            start_timestamp = date_str_to_unix_timestamp(start_date_str)
        except ValueError:
            return Response(
                create_error_response(
                    "Invalid start_date format. Expected YYYY-MM-DD.", 400),
                status=400
            )

        try:
            if end_date_str:
                end_timestamp = date_str_to_unix_timestamp(end_date_str)
            else:
                # Current time as Unix timestamp
                end_timestamp = int(datetime.now(timezone.utc).timestamp())
        except ValueError:
            return Response(
                create_error_response(
                    "Invalid end_date format. Expected YYYY-MM-DD.", 400),
                status=400
            )

        if start_timestamp > end_timestamp:
            return Response(
                create_error_response(
                    "start_date must be earlier than end_date.", 400),
                status=400
            )

        # Verify that each commander exists
        existing_commanders = MoxfieldBoardCard.objects.filter(
            card__unique_card_id__in=commander_unique_card_ids
        ).values_list('card__unique_card_id', flat=True).distinct()

        missing_commanders = set(
            commander_unique_card_ids) - set(existing_commanders)

        if missing_commanders:
            return Response(
                create_error_response(
                    f"The following commander_unique_card_id(s) do not exist: {', '.join(missing_commanders)}.", 400),
                status=400
            )

        # Validate tournament_size
        if tournament_size:
            try:
                tournament_size = int(tournament_size)
                if tournament_size < 1:
                    raise ValueError
            except ValueError:
                return Response(
                    create_error_response(
                        "Invalid tournament_size. It must be a positive integer.", 400),
                    status=400
                )

        # Create a unique cache key based on filter parameters
        sorted_commanders = sorted(commander_unique_card_ids)
        cache_key = f"commander_stats_{start_date_str}_{end_date_str}_{tournament_size}_{'_'.join(sorted_commanders)}"
        cached_response = cache.get(cache_key)
        if cached_response:
            logger.debug(f"Cache hit for key: {cache_key}")
            return Response(cached_response, status=200)

        # Filter tournaments based on date range
        tournament_filter = Q(start_date__range=(
            start_timestamp, end_timestamp))

        # Annotate tournaments with player count
        tournaments = TopdeckTournament.objects.annotate(
            player_count=Count('standings')
        ).filter(tournament_filter)

        # Filter based on tournament_size (player_count >= tournament_size)
        if tournament_size:
            tournaments = tournaments.filter(player_count__gte=tournament_size)

        if not tournaments.exists():
            logger.debug("No tournaments found for the given filters.")
            return Response(
                create_success_response(
                    {"message": "No tournaments found for the given filters."}),
                status=200
            )

        # Get all TopdeckPlayerStanding linked to these tournaments
        standings = TopdeckPlayerStanding.objects.filter(
            tournament__in=tournaments
        ).select_related('deck', 'tournament').prefetch_related('deck__boards__board_cards__card')

        if not standings.exists():
            logger.debug("No player standings found for the given filters.")
            return Response(
                create_success_response(
                    {"message": "No player standings found for the given filters."}),
                status=200
            )

        # If specific commanders are requested, filter standings accordingly
        if commander_unique_card_ids:
            # Identify decks that have all specified commanders
            decks_with_commanders = MoxfieldDeck.objects.filter(
                player_standings__in=standings,
                boards__key__iexact='commanders'
            ).distinct()

            # For each commander, ensure the deck includes it
            for commander_id in commander_unique_card_ids:
                decks_with_commanders = decks_with_commanders.filter(
                    boards__board_cards__card__unique_card_id=commander_id
                )

            # Debugging: Log the number of decks found
            logger.debug(
                f"Decks with commanders {commander_unique_card_ids}: {decks_with_commanders.count()}"
            )

            # Filter standings to only include those decks
            standings = standings.filter(deck__in=decks_with_commanders)

            if not standings.exists():
                logger.debug(
                    f"No standings found for commander(s) with unique_card_id(s): {', '.join(commander_unique_card_ids)}."
                )
                return Response(
                    create_success_response(
                        {"message": f"No standings found for commander(s) with unique_card_id(s): {', '.join(commander_unique_card_ids)}."}),
                    status=200
                )

        # Aggregate data per commander pair
        # Create a mapping from deck_id to list of commanders
        commanders_mapping = defaultdict(list)

        # Fetch all commanders for these decks
        commanders_qs = MoxfieldBoardCard.objects.filter(
            board__deck__in=decks_with_commanders,
            board__key__iexact='commanders',
            card__unique_card_id__in=commander_unique_card_ids
        ).select_related('card').distinct()

        for bc in commanders_qs:
            commanders_mapping[bc.board.deck.id].append({
                'unique_card_id': bc.card.unique_card_id,
                'card_name': bc.card.name
            })

        # Debugging: Log commanders mapping
        logger.debug(f"Commanders Mapping: {dict(commanders_mapping)}")

        # Now, iterate through standings and assign commanders
        # We'll duplicate standings per commander pair to aggregate stats per pair
        expanded_standings = []

        for standing in standings:
            deck_id = standing.deck_id
            commanders = commanders_mapping.get(deck_id, [])
            if not commanders:
                # Debugging: No commanders found for this deck
                logger.debug(f"No commanders found for Deck ID {deck_id}")
                continue
            # Ensure that the deck has exactly the specified commanders
            if len(commanders) != len(commander_unique_card_ids):
                logger.debug(
                    f"Deck ID {deck_id} does not have all specified commanders."
                )
                continue
            # Sort commanders to maintain consistency
            sorted_commanders = sorted(
                commanders, key=lambda x: x['unique_card_id']
            )
            # Create a unique identifier for the commander pair
            commander_pair_id = "_".join(
                [c['unique_card_id'] for c in sorted_commanders]
            )
            commander_pair_name = " & ".join(
                [c['card_name'] for c in sorted_commanders]
            )
            expanded_standings.append({
                'wins': standing.wins,
                'draws': standing.draws,
                'losses': standing.losses,  # Track losses
                'commander_pair_id': commander_pair_id,
                'commander_pair_name': commander_pair_name,
                'deck': standing.deck,
                'tournament_start_date': standing.tournament.start_date,
            })

        if not expanded_standings:
            logger.debug("No commanders found in the specified decks.")
            return Response(
                create_success_response(
                    {"message": "No commanders found in the specified decks."}),
                status=200
            )

        # Organize data per commander pair
        commanders_data = defaultdict(lambda: {
            'commander_pair_id': '',
            'commander_pair_name': '',
            'total_entries': 0,
            'total_wins': 0,
            'total_draws': 0,
            'total_losses': 0,  # Initialize total_losses
            'cards': defaultdict(lambda: {
                'unique_card_id': '',
                'card_name': '',
                'number_of_entries': 0,
                'total_wins': 0,
                'total_draws': 0,
                'total_losses': 0,  # Initialize card_losses
            }),
            'daily_popularity': defaultdict(int),
            'daily_win_rates': defaultdict(lambda: {'wins': 0, 'draws': 0, 'losses': 0, 'entries': 0}),
        })

        # Iterate through expanded_standings to aggregate data
        for es in expanded_standings:
            commander_pair_id = es['commander_pair_id']
            commander_pair_name = es['commander_pair_name']
            deck = es['deck']
            # Convert Unix timestamp to date using tournament_start_date
            tournament_date = unix_timestamp_to_date(
                es['tournament_start_date'])

            commanders_data[commander_pair_id]['commander_pair_id'] = commander_pair_id
            commanders_data[commander_pair_id]['commander_pair_name'] = commander_pair_name
            commanders_data[commander_pair_id]['total_entries'] += 1
            commanders_data[commander_pair_id]['total_wins'] += es['wins']
            commanders_data[commander_pair_id]['total_draws'] += es['draws']
            commanders_data[commander_pair_id]['total_losses'] += es['losses']

            # Popularity over time (daily)
            commanders_data[commander_pair_id]['daily_popularity'][tournament_date] += 1

            # Commander win rate over time (daily)
            commanders_data[commander_pair_id]['daily_win_rates'][tournament_date]['wins'] += es['wins']
            commanders_data[commander_pair_id]['daily_win_rates'][tournament_date]['draws'] += es['draws']
            commanders_data[commander_pair_id]['daily_win_rates'][tournament_date]['losses'] += es['losses']
            commanders_data[commander_pair_id]['daily_win_rates'][tournament_date]['entries'] += 1

            # Aggregate card statistics
            # Traverse decks' boards and board_cards to get all non-commander cards in the deck
            non_commander_board_cards = MoxfieldBoardCard.objects.filter(
                board__deck=deck
            ).exclude(
                board__key__iexact='commanders'
            ).select_related('card')

            for bc in non_commander_board_cards:
                card_id = bc.card.unique_card_id
                card_name = bc.card.name
                commanders_data[commander_pair_id]['cards'][card_id]['unique_card_id'] = card_id
                commanders_data[commander_pair_id]['cards'][card_id]['card_name'] = card_name
                commanders_data[commander_pair_id]['cards'][card_id]['number_of_entries'] += 1
                commanders_data[commander_pair_id]['cards'][card_id]['total_wins'] += es['wins']
                commanders_data[commander_pair_id]['cards'][card_id]['total_draws'] += es['draws']
                commanders_data[commander_pair_id]['cards'][card_id]['total_losses'] += es['losses']

        # Prepare the final data structure
        response_commanders = []

        for commander_pair_id, data in commanders_data.items():
            # Calculate total games played
            total_games_played = data['total_wins'] + \
                data['total_draws'] + data['total_losses']

            # Calculate overall win, draw, and loss rates
            overall_win_rate = data['total_wins'] / \
                total_games_played if total_games_played > 0 else 0
            overall_draw_rate = data['total_draws'] / \
                total_games_played if total_games_played > 0 else 0
            overall_loss_rate = data['total_losses'] / \
                total_games_played if total_games_played > 0 else 0

            # Prepare popularity_over_time and commander_winrate_over_time
            popularity_over_time = [
                {"day": day.isoformat(), "count": count}
                for day, count in sorted(data['daily_popularity'].items())
            ]

            commander_winrate_over_time = []
            for day, win_data in sorted(data['daily_win_rates'].items()):
                wins = win_data['wins']
                draws = win_data['draws']
                losses = win_data['losses']
                entries = win_data['entries']
                win_rate = wins / entries if entries > 0 else 0
                draw_rate = draws / entries if entries > 0 else 0
                loss_rate = losses / entries if entries > 0 else 0
                commander_winrate_over_time.append({
                    "day": day.isoformat(),
                    "wins": wins,
                    "draws": draws,
                    "losses": losses,
                    "entries": entries,
                    "win_rate": win_rate,
                    "draw_rate": draw_rate,
                    "loss_rate": loss_rate
                })

            # Calculate card statistics with Chi-Squared Test
            cards_list = []
            for card_id, card_data in data['cards'].items():
                number_of_entries = card_data['number_of_entries']
                card_wins = card_data['total_wins']
                card_draws = card_data['total_draws']
                card_losses = card_data['total_losses']

                average_card_win_rate = card_wins / \
                    number_of_entries if number_of_entries > 0 else 0
                average_card_draw_rate = card_draws / \
                    number_of_entries if number_of_entries > 0 else 0
                average_card_loss_rate = card_losses / \
                    number_of_entries if number_of_entries > 0 else 0

                # Perform Chi-Squared Test for the card
                try:
                    # Observed frequencies
                    observed = np.array([
                        card_wins,
                        card_draws,
                        card_losses
                    ])

                    # Games with the card
                    with_card = card_wins + card_draws + card_losses

                    # Games without the card
                    without_card = total_games_played - with_card

                    # Wins without the card
                    wins_without_card = data['total_wins'] - card_wins
                    # Draws without the card
                    draws_without_card = data['total_draws'] - card_draws
                    # Losses without the card
                    losses_without_card = data['total_losses'] - card_losses

                    # Ensure no negative frequencies
                    if wins_without_card < 0 or draws_without_card < 0 or losses_without_card < 0:
                        raise ValueError("Negative frequencies encountered.")

                    # Observed contingency table
                    observed_table = [
                        [card_wins, card_draws, card_losses],
                        [wins_without_card, draws_without_card, losses_without_card]
                    ]

                    # Perform Chi-Squared Test
                    chi2, p, dof, ex = chi2_contingency(observed_table)

                    chi_squared_test = {
                        'chi2_statistic': chi2,
                        'p_value': p,
                        'degrees_of_freedom': dof,
                        'expected_freq': ex.tolist()
                    }
                except ValueError as ve:
                    logger.error(
                        f"Chi-Squared Test failed for Card {card_id}: {ve}")
                    chi_squared_test = {
                        'chi2_statistic': None,
                        'p_value': None,
                        'degrees_of_freedom': None,
                        'expected_freq': None
                    }

                cards_list.append({
                    "unique_card_id": card_data['unique_card_id'],
                    "card_name": card_data['card_name'],
                    "number_of_entries": number_of_entries,
                    "average_card_win_rate": average_card_win_rate,
                    "average_card_draw_rate": average_card_draw_rate,
                    "average_card_loss_rate": average_card_loss_rate,
                    "chi_squared_test": chi_squared_test  # Added field
                })

            # Perform Chi-Squared Test for the commander pair
            try:
                # Observed frequencies
                observed = np.array([
                    data['total_wins'],
                    data['total_draws'],
                    data['total_losses']
                ])

                # Games with the commander
                with_commander = data['total_wins'] + \
                    data['total_draws'] + data['total_losses']

                # Games without the commander
                without_commander = total_games_played - with_commander

                # Wins without the commander
                wins_without_commander = data['total_wins'] - \
                    data['total_wins']
                # Draws without the commanders
                draws_without_commander = data['total_draws'] - \
                    data['total_draws']
                # Losses without the commander
                losses_without_commander = data['total_losses'] - \
                    data['total_losses']

                # Ensure no negative frequencies
                if wins_without_commander < 0 or draws_without_commander < 0 or losses_without_commander < 0:
                    raise ValueError("Negative frequencies encountered.")

                # Observed contingency table
                observed_table_commander = [
                    [data['total_wins'], data['total_draws'], data['total_losses']],
                    [wins_without_commander, draws_without_commander,
                        losses_without_commander]
                ]

                # Perform Chi-Squared Test
                chi2_commander, p_commander, dof_commander, ex_commander = chi2_contingency(
                    observed_table_commander)

                chi_squared_test_commander = {
                    'chi2_statistic': chi2_commander,
                    'p_value': p_commander,
                    'degrees_of_freedom': dof_commander,
                    'expected_freq': ex_commander.tolist()
                }
            except ValueError as ve:
                logger.error(
                    f"Chi-Squared Test failed for Commander Pair {commander_pair_id}: {ve}")
                chi_squared_test_commander = {
                    'chi2_statistic': None,
                    'p_value': None,
                    'degrees_of_freedom': None,
                    'expected_freq': None
                }

            # Log total wins, draws, and losses for debugging
            logger.debug(
                f"Commander Pair {commander_pair_id} - Total Wins: {data['total_wins']}, Total Draws: {data['total_draws']}, Total Losses: {data['total_losses']}"
            )

            commander_entry = {
                "commander_pair_id": commander_pair_id,
                "commander_pair_name": data['commander_pair_name'],
                "total_entries": data['total_entries'],
                "total_wins": data['total_wins'],
                "total_draws": data['total_draws'],
                "total_losses": data['total_losses'],
                "overall_win_rate": overall_win_rate,
                "overall_draw_rate": overall_draw_rate,
                "overall_loss_rate": overall_loss_rate,
                "popularity_over_time": popularity_over_time,
                "commander_winrate_over_time": commander_winrate_over_time,
                "cards": cards_list,
                "chi_squared_test": chi_squared_test_commander  # Updated field
            }

            response_commanders.append(commander_entry)

        # Serialize the data
        serializer = CommanderStatisticsResponseSerializer(
            {"commanders": response_commanders}
        )
        response_data = serializer.data

        # Cache the response for 1 hour (3600 seconds)
        cache.set(cache_key, response_data, timeout=3600)

        logger.debug(f"Response data cached with key: {cache_key}")

        return Response(create_success_response(response_data), status=200)

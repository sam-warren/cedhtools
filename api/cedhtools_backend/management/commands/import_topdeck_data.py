"""
Management command to fetch and store tournament data from the topdeck.gg API.
Processes data in monthly batches starting from a specified date.

The command fetches tournament data month by month and processes:
- Tournament details (metadata, standings, etc.)
- Player information (both registered and anonymous players)
- Match results and participants
- Player standings and statistics

It handles both players with topdeck IDs and anonymous players, maintaining
data integrity while capturing as much tournament information as possible.

Usage:
    python manage.py import_topdeck_data --start YYYY-MM-DD --end YYYY-MM-DD
"""

import logging
import requests
from typing import Optional, List
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from cedhtools_backend.models import (
    TopdeckTournament,
    TopdeckPlayer,
    TopdeckPlayerStanding,
    TopdeckMatch,
    TopdeckMatchPlayer
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Django management command for importing tournament data from topdeck.gg API."""

    help = 'Fetch tournaments data from topdeck.gg API in monthly batches.'

    def add_arguments(self, parser):
        """Add command line arguments for date range specification."""
        parser.add_argument(
            '--start',
            help='Start date in YYYY-MM-DD format',
            default='2022-06-01'
        )
        parser.add_argument(
            '--end',
            help='End date in YYYY-MM-DD format (defaults to current date)',
            default=None
        )

    def handle(self, *args, **options):
        """
        Main command handler that processes tournaments in monthly chunks.
        This approach helps manage API rate limits and memory usage.
        """
        start_date = self._parse_date(options['start'])
        end_date = self._parse_date(options['end'])

        if start_date > end_date:
            logger.error("Start date must be earlier than end date.")
            raise CommandError("Start date must be earlier than end date.")

        logger.info(
            f"Starting tournament import from {start_date.date()} to {end_date.date()}")

        current_start = start_date
        total_tournaments = 0

        while current_start < end_date:
            current_end = min(
                current_start + relativedelta(months=1), end_date)
            logger.info(
                f"Processing month: {current_start.date()} to {current_end.date()}"
            )

            try:
                tournaments_fetched = self.fetch_and_store_tournaments(
                    int(current_start.timestamp()),
                    int(current_end.timestamp())
                )
                total_tournaments += tournaments_fetched

                logger.info(
                    f"Completed month {current_start.date()}: processed {tournaments_fetched} tournaments"
                )
            except CommandError as ce:
                logger.error(
                    f"Failed to process month {current_start.date()} to {current_end.date()}: {ce}"
                )
                continue

            current_start = current_end

        logger.info(
            f"Import complete. Total tournaments processed: {total_tournaments}")

    def fetch_and_store_tournaments(self, start_ts: int, end_ts: int) -> int:
        """
        Fetch and store tournament data for the given time period.

        Args:
            start_ts: Unix timestamp for period start
            end_ts: Unix timestamp for period end

        Returns:
            Number of tournaments successfully processed
        """
        if not settings.TOPDECK_API_KEY:
            logger.error("TOPDECK_API_KEY not found in settings")
            raise CommandError("TOPDECK_API_KEY is not set.")

        logger.debug(
            f"Fetching tournament data for period {start_ts} to {end_ts}")
        tournaments_data = self._fetch_tournament_data(start_ts, end_ts)
        return self._process_tournament_data(tournaments_data)

    def _fetch_tournament_data(self, start_ts: int, end_ts: int) -> List[dict]:
        """
        Fetch tournament data from the API.

        Requests tournament data including standings, matches, and player details
        within the specified time period.
        """
        headers = {
            'Authorization': settings.TOPDECK_API_KEY,
            'Content-Type': 'application/json'
        }

        payload = {
            "game": "Magic: The Gathering",
            "format": "EDH",
            "start": start_ts,
            "end": end_ts,
            "columns": [
                "name", "decklist", "wins", "winsSwiss", "winsBracket",
                "byes", "draws", "losses", "lossesSwiss", "lossesBracket", "id"
            ],
            "rounds": True,
            "tables": ["table", "players", "winner", "status"],
            "players": ["name", "id", "decklist", "elo"]
        }

        try:
            logger.debug(
                f"Making API request to {settings.TOPDECK_API_BASE_URL}/v2/tournaments")
            response = requests.post(
                f"{settings.TOPDECK_API_BASE_URL}/v2/tournaments",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            tournaments = response.json()
            logger.info(f"Retrieved {len(tournaments)} tournaments from API")
            return tournaments
        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise CommandError(f"Error fetching data: {e}")
        except ValueError as ve:
            logger.error(f"Failed to parse API response: {ve}")
            raise CommandError("Failed to parse JSON response from API.")

    def _process_tournament_data(self, tournaments_data: List[dict]) -> int:
        """
        Process and store tournament data.

        Each tournament is processed in its own transaction to ensure data consistency.
        If a tournament fails to process, the error is logged and processing continues
        with the next tournament.
        """
        tournaments_processed = 0

        for tournament_data in tournaments_data:
            tid = tournament_data.get('TID', 'unknown')
            logger.info(f"Processing tournament {tid}")

            try:
                with transaction.atomic():
                    tournament = self._process_single_tournament(
                        tournament_data)
                    if tournament:
                        tournaments_processed += 1
                        logger.debug(
                            f"Successfully processed tournament {tid}")
            except Exception as e:
                logger.error(f"Failed to process tournament {tid}: {str(e)}")
                continue

        return tournaments_processed

    def _process_single_tournament(self, tournament_data: dict) -> Optional[TopdeckTournament]:
        """
        Process and store a single tournament and its related data.

        Creates or updates:
        - Tournament record
        - Player standings
        - Match records
        - Match player records
        """
        try:
            tid = tournament_data['TID']
            tournament_size = len(tournament_data.get('standings', []))

            logger.debug(
                f"Creating/updating tournament {tid} with {tournament_size} players")

            tournament = TopdeckTournament.objects.update_or_create(
                tid=tid,
                defaults={
                    'name': tournament_data.get('tournamentName'),
                    'swiss_num': tournament_data.get('swissNum', 0),
                    'start_date': tournament_data.get('startDate', 0),
                    'top_cut': tournament_data.get('topCut', 0),
                    'tournament_size': tournament_size,
                    'average_elo': tournament_data.get('averageElo'),
                    'mode_elo': tournament_data.get('modeElo'),
                    'median_elo': tournament_data.get('medianElo'),
                    'top_elo': tournament_data.get('topElo')
                }
            )[0]

            # Process tournament components
            self._process_players_and_standings(tournament, tournament_data)
            self._process_matches(tournament, tournament_data)

            return tournament

        except Exception as e:
            logger.error(f"Error in tournament processing: {e}")
            raise

    def _process_players_and_standings(self, tournament: TopdeckTournament, tournament_data: dict):
        """
        Process and store players and their standings.

        Handles both identified and anonymous players, creating standings records
        with appropriate statistics and validated decklist URLs.
        """
        current_timestamp = int(datetime.now().timestamp())
        tournament.standings.all().delete()
        processed_players = set()

        logger.info(f"Processing standings for tournament {tournament.tid}")

        for standing_data in tournament_data.get('standings', []):
            try:
                player_id = standing_data.get('id')
                player_name = standing_data.get('name', 'Unknown')

                if player_id in processed_players:
                    logger.warning(
                        f"Duplicate standing found for player {player_name} (ID: {player_id})")
                    continue

                # Handle player creation/update
                player = None
                if player_id:
                    processed_players.add(player_id)
                    player, created = TopdeckPlayer.objects.get_or_create(
                        topdeck_id=player_id,
                        defaults={
                            'name': player_name,
                            'first_seen_date': tournament.start_date,
                            'last_seen_date': current_timestamp
                        }
                    )
                    if not created:
                        player.last_seen_date = current_timestamp
                        player.save()
                        logger.debug(f"Updated existing player: {player_name}")
                    else:
                        logger.debug(f"Created new player: {player_name}")
                else:
                    logger.info(f"Processing anonymous player: {player_name}")

                # Calculate statistics
                total_matches = (
                    standing_data.get('wins', 0) +
                    standing_data.get('losses', 0) +
                    standing_data.get('draws', 0)
                )

                rates = {
                    'win_rate': standing_data.get('wins', 0) / total_matches if total_matches > 0 else 0.0,
                    'loss_rate': standing_data.get('losses', 0) / total_matches if total_matches > 0 else 0.0,
                    'draw_rate': standing_data.get('draws', 0) / total_matches if total_matches > 0 else 0.0
                }

                # Validate decklist
                raw_decklist = standing_data.get('decklist')
                valid_decklist = self._is_valid_decklist(raw_decklist)
                if raw_decklist and not valid_decklist:
                    logger.info(
                        f"Invalid/non-Moxfield decklist for player {player_name}: {raw_decklist[:50]}...")

                # Create standing record
                standing = TopdeckPlayerStanding.objects.create(
                    tournament=tournament,
                    player=player,
                    player_topdeck_id=player_id,
                    decklist=valid_decklist,
                    standing_position=tournament_data['standings'].index(
                        standing_data) + 1,
                    wins=standing_data.get('wins', 0),
                    wins_swiss=standing_data.get('winsSwiss', 0),
                    wins_bracket=standing_data.get('winsBracket', 0),
                    byes=standing_data.get('byes', 0),
                    draws=standing_data.get('draws', 0),
                    losses=standing_data.get('losses', 0),
                    losses_swiss=standing_data.get('lossesSwiss', 0),
                    losses_bracket=standing_data.get('lossesBracket', 0),
                    total_matches=total_matches,
                    computed_win_rate=rates['win_rate'],
                    computed_loss_rate=rates['loss_rate'],
                    computed_draw_rate=rates['draw_rate']
                )
                logger.debug(
                    f"Created standing for {player_name}: position {standing.standing_position}")

            except Exception as e:
                logger.error(
                    f"Failed to process standing for {player_name}: {str(e)}")
                raise

    def _process_matches(self, tournament: TopdeckTournament, tournament_data: dict):
        """
        Process and store matches and match players.

        Creates records for:
        - Individual matches
        - Match results
        - Player participation in matches
        """
        tournament.matches.all().delete()
        logger.info(f"Processing matches for tournament {tournament.tid}")

        for round_data in tournament_data.get('rounds', []):
            # If round is not a number, it is a top cut round
            round_str = round_data.get('round', '')
            is_top_cut = self._is_top_cut_round(round_str)
            logger.debug(
                f"Processing round {round_str} (Top cut: {is_top_cut})")

            for table_data in round_data.get('tables', []):
                try:
                    table_num = table_data['table']
                    logger.debug(f"Processing table {table_num}")

                    # Handle match winner
                    winner = None
                    winner_id = table_data.get('winner_id')
                    if winner_id and winner_id != 'Draw':
                        winner, _ = TopdeckPlayer.objects.get_or_create(
                            topdeck_id=winner_id,
                            defaults={'name': table_data.get(
                                'winner', 'Unknown')}
                        )

                    # Create match record
                    match = TopdeckMatch.objects.create(
                        tournament=tournament,
                        round=round_str,
                        table_number=table_data['table'],
                        status=table_data.get('status', 'Unknown'),
                        is_draw=table_data.get('winner') == 'Draw',
                        is_top_cut=is_top_cut,
                        pod_size=len(table_data.get('players', [])),
                        winner=winner,
                        winner_topdeck_id=winner_id if winner_id != 'Draw' else None
                    )

                    # Process match players
                    for seat, player_data in enumerate(table_data.get('players', []), 1):
                        player_id = player_data.get('id')
                        player_name = player_data.get('name', 'Unknown')

                        player = None
                        if player_id:
                            player, _ = TopdeckPlayer.objects.get_or_create(
                                topdeck_id=player_id,
                                defaults={'name': player_name}
                            )

                        TopdeckMatchPlayer.objects.create(
                            match=match,
                            player=player,
                            player_topdeck_id=player_id,
                            seat_position=seat
                        )
                        logger.debug(
                            f"Added player {player_name} to match at seat {seat}")

                except Exception as e:
                    logger.error(
                        f"Error processing table {table_data.get('table')}: {str(e)}")
                    raise

    def _is_top_cut_round(round_str: str) -> bool:
        """
        Determine if a round is a top cut round based on actual tournament data patterns.

        Top cut rounds either:
        1. Start with "Top" (e.g., "Top 16", "Top 4")
        2. Are named rounds (e.g., "Semifinals", "Finals", "Quarterfinals")
        3. Not numeric or "Round X" format
        """
        # Standardize input
        round_str = str(round_str).strip().lower()

        # Check for named rounds
        named_rounds = {'semifinals', 'finals', 'quarterfinals'}
        if round_str in named_rounds:
            return True

        # Check for "Top X" format
        if round_str.startswith('top'):
            return True

        # Remove "round " prefix if present
        if round_str.startswith('round '):
            round_str = round_str.replace('round ', '')

        # If what remains is a number, it's a swiss round
        try:
            int(round_str)
            return False
        except ValueError:
            return True

    def _is_valid_decklist(self, decklist: Optional[str]) -> Optional[str]:
        """
        Validates decklist URL. Returns the URL if valid, None otherwise.
        """
        if not decklist:
            return None

        # Case for moxfield URLs
        if isinstance(decklist, str) and "moxfield.com/decks/" in decklist:
            return decklist

        return None

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> datetime:
        """Parse date string or return current date."""
        if not date_str:
            return datetime.now()

        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            logger.error(
                f"Invalid date format: {date_str}. Expected YYYY-MM-DD.")
            raise CommandError(
                f"Invalid date format: {date_str}. Expected YYYY-MM-DD.")

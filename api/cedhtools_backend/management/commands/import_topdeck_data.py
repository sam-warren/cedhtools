"""
Management command to fetch and store tournament data from the topdeck.gg API.
Processes data in monthly batches starting from a specified date.
"""

import logging
import requests
import re
from typing import Optional, List
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.exceptions import ValidationError
from cedhtools_backend.models import TopdeckTournament, TopdeckPlayerStanding

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Django management command for importing tournament data from topdeck.gg."""

    help = 'Fetch tournaments data from topdeck.gg API in monthly batches starting from June 1, 2022.'

    def add_arguments(self, parser):
        """Add command line arguments."""
        parser.add_argument(
            '--start',
            help='Start date in YYYY-MM-DD format',
            default='2022-06-01'
        )
        parser.add_argument(
            '--end',
            help='End date in YYYY-MM-DD format',
            default=None
        )

    def handle(self, *args, **options):
        """Handle the command execution."""
        start_date = self._parse_date(options['start'])
        end_date = self._parse_date(options['end'])

        if start_date > end_date:
            logger.error("Start date must be earlier than end date.")
            raise CommandError("Start date must be earlier than end date.")

        current_start = start_date
        while current_start < end_date:
            current_end = min(
                current_start + relativedelta(months=1), end_date)
            logger.info(
                f"Fetching tournaments from {current_start.date()} to {current_end.date()}.")

            try:
                tournaments_fetched = self.fetch_and_store_tournaments(
                    int(current_start.timestamp()),
                    int(current_end.timestamp())
                )
                logger.info(
                    f"Processed {tournaments_fetched} tournaments for period "
                    f"{current_start.date()} to {current_end.date()}."
                )
            except CommandError as ce:
                logger.error(
                    f"Failed to process tournaments for period {current_start.date()} "
                    f"to {current_end.date()}: {ce}"
                )
                continue

            current_start = current_end

        logger.info("Tournament data import completed successfully.")

    def fetch_and_store_tournaments(self, start_ts: int, end_ts: int) -> int:
        """
        Fetch and store tournament data for the given time period.

        Args:
            start_ts: Start timestamp
            end_ts: End timestamp

        Returns:
            Number of tournaments processed

        Raises:
            CommandError: If API key is missing or API request fails
        """
        if not settings.TOPDECK_API_KEY:
            logger.error(
                "TOPDECK_API_KEY is not set in the environment or settings.")
            raise CommandError("TOPDECK_API_KEY is not set.")

        tournaments_data = self._fetch_tournament_data(start_ts, end_ts)
        return self._process_tournament_data(tournaments_data)

    def _fetch_tournament_data(self, start_ts: int, end_ts: int) -> List[dict]:
        """
        Fetch tournament data from the API.

        Args:
            start_ts: Start timestamp
            end_ts: End timestamp

        Returns:
            List of tournament data dictionaries

        Raises:
            CommandError: If API request fails or response is invalid
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
            "columns": ["decklist", "wins", "draws", "losses"]
        }

        try:
            response = requests.post(
                f"{settings.TOPDECK_API_BASE_URL}/v2/tournaments",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            logger.info(
                f"Successfully fetched {len(data)} tournaments from API.")
            return data
        except requests.RequestException as e:
            logger.error(f"Error fetching data from API: {e}")
            raise CommandError(f"Error fetching data: {e}") from e
        except ValueError as ve:
            logger.error("Failed to parse JSON response from API.")
            raise CommandError(
                "Failed to parse JSON response from API.") from ve

    def _process_tournament_data(self, tournaments_data: List[dict]) -> int:
        """
        Process and store tournament data.

        Args:
            tournaments_data: List of tournament data from API

        Returns:
            Number of tournaments processed successfully
        """
        tournaments_processed = 0

        for tournament_data in tournaments_data:
            tournament = self._process_single_tournament(tournament_data)
            if tournament:
                tournaments_processed += 1

        return tournaments_processed

    def _process_single_tournament(self, tournament_data: dict) -> Optional[TopdeckTournament]:
        """
        Process and store a single tournament and its standings.

        Args:
            tournament_data: Tournament data dictionary

        Returns:
            Created/updated tournament object or None if processing failed
        """
        try:
            tournament, created = TopdeckTournament.objects.update_or_create(
                tid=tournament_data.get('TID'),
                defaults={
                    'swiss_num': tournament_data.get('swissNum', 0),
                    'start_date': tournament_data.get('startDate', 0),
                    'top_cut': tournament_data.get('topCut', 0),
                }
            )

            logger.info(
                f"{'Created' if created else 'Updated'} tournament: {tournament.tid}"
            )

            self._process_tournament_standings(
                tournament, tournament_data.get('standings', []))
            return tournament

        except Exception as e:
            logger.error(f"Error processing tournament data: {e}")
            return None

    def _process_tournament_standings(self, tournament: TopdeckTournament, standings_data: List[dict]):
        """
        Process and store tournament standings.

        Args:
            tournament: Tournament object
            standings_data: List of player standing data
        """
        # Clear existing standings
        previous_count = tournament.standings.count()
        tournament.standings.all().delete()
        if previous_count:
            logger.info(
                f"Deleted {previous_count} previous standings for tournament: {tournament.tid}"
            )

        # Process new standings
        player_objects = []
        for player_data in standings_data:
            standing = self._create_player_standing(tournament, player_data)
            if standing:
                player_objects.append(standing)

        if player_objects:
            try:
                TopdeckPlayerStanding.objects.bulk_create(player_objects)
                logger.info(
                    f"Added {len(player_objects)} player standings for tournament: {tournament.tid}"
                )
            except (ValidationError, Exception) as e:
                logger.error(
                    f"Error adding player standings for tournament '{tournament.tid}': {e}"
                )

    def _create_player_standing(
        self,
        tournament: TopdeckTournament,
        player_data: dict
    ) -> Optional[TopdeckPlayerStanding]:
        """
        Create a player standing object from player data.

        Args:
            tournament: Tournament object
            player_data: Player standing data

        Returns:
            TopdeckPlayerStanding object or None if data is invalid
        """
        decklist = player_data.get('decklist')
        if not self._validate_decklist_url(decklist):
            logger.warning(
                f"Invalid decklist URL for player '{player_data.get('name')}' "
                f"in tournament '{tournament.tid}': {decklist}"
            )
            return None

        stats = self._calculate_player_stats(player_data, tournament.tid)
        if not stats:
            return None

        return TopdeckPlayerStanding(
            tournament=tournament,
            decklist=decklist,
            **stats
        )

    @staticmethod
    def _validate_decklist_url(url: Optional[str]) -> bool:
        """Validate Moxfield decklist URL."""
        if not url:
            return False
        return bool(re.match(r'^(https?://)?(www\.)?moxfield\.com/decks/.*$', url))

    @staticmethod
    def _calculate_player_stats(player_data: dict, tournament_id: str) -> Optional[dict]:
        """Calculate player statistics from raw data."""
        wins = player_data.get('wins')
        draws = player_data.get('draws')
        losses = player_data.get('losses')

        if any(stat is None for stat in (wins, draws, losses)):
            logger.warning(
                f"Invalid game statistics for player '{player_data.get('name')}' "
                f"in tournament '{tournament_id}'"
            )
            return None

        total_games = wins + draws + losses
        if total_games == 0:
            logger.warning(
                f"Player '{player_data.get('name')}' in tournament '{tournament_id}' "
                f"has 0 total games played."
            )
            return None

        return {
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'win_rate': wins / total_games,
            'draw_rate': draws / total_games,
            'loss_rate': losses / total_games
        }

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> datetime:
        """
        Parse date string in YYYY-MM-DD format or return current date.

        Args:
            date_str: Date string to parse

        Returns:
            Parsed datetime object

        Raises:
            CommandError: If date format is invalid
        """
        if not date_str:
            return datetime.now()

        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError as ve:
            logger.error(
                f"Invalid date format: {date_str}. Expected YYYY-MM-DD.")
            raise CommandError(
                f"Invalid date format: {date_str}. Expected YYYY-MM-DD."
            ) from ve

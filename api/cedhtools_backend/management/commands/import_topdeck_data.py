import logging
import requests
import os
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from cedhtools_backend.models import Tournament, PlayerStanding
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetch tournaments data from topdeck.gg API in 6-month batches starting from June 1, 2022.'

    def add_arguments(self, parser):
        # Optionally allow passing custom start and end dates through command line arguments.
        parser.add_argument(
            '--start', help='Start date in YYYY-MM-DD format', default='2022-06-01')
        parser.add_argument(
            '--end', help='End date in YYYY-MM-DD format', default=None)

    def handle(self, *args, **options):
        start_str = options['start']
        end_str = options['end']

        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d')
            logger.info(f"Import started with start date: {start_date.date()}")
        except ValueError as ve:
            logger.error(
                f"Invalid start date format: {start_str}. Expected YYYY-MM-DD.")
            raise CommandError(
                f"Invalid start date format: {start_str}. Expected YYYY-MM-DD.") from ve

        if end_str:
            try:
                end_date = datetime.strptime(end_str, '%Y-%m-%d')
                logger.info(
                    f"Import will run until end date: {end_date.date()}")
            except ValueError as ve:
                logger.error(
                    f"Invalid end date format: {end_str}. Expected YYYY-MM-DD.")
                raise CommandError(
                    f"Invalid end date format: {end_str}. Expected YYYY-MM-DD.") from ve
        else:
            end_date = datetime.now()
            logger.info(
                f"No end date provided. Using current date: {end_date.date()}")

        if start_date > end_date:
            logger.error("Start date must be earlier than end date.")
            raise CommandError("Start date must be earlier than end date.")

        # We will fetch data in 1-month batches
        current_start = start_date
        current_end = start_date + relativedelta(months=1)

        # Loop until we surpass the end_date
        while current_start < end_date:
            # Make sure we don't go beyond the defined end_date
            if current_end > end_date:
                current_end = end_date

            # Convert to Unix timestamps (seconds)
            start_ts = int(time.mktime(current_start.timetuple()))
            end_ts = int(time.mktime(current_end.timetuple()))

            logger.info(
                f"Fetching tournaments from {current_start.date()} to {current_end.date()}.")

            try:
                tournaments_fetched = self.fetch_and_store_tournaments(
                    start_ts, end_ts)
                logger.info(
                    f"Fetched and stored {tournaments_fetched} tournaments from {current_start.date()} to {current_end.date()}.")
            except CommandError as ce:
                logger.error(
                    f"Failed to fetch/store tournaments for period {current_start.date()} to {current_end.date()}: {ce}")
                # Depending on requirements, you might choose to continue or abort
                continue

            # Move to the next 1-month interval
            current_start = current_end
            current_end = current_start + relativedelta(months=1)

        logger.info("All tournament data imported/updated successfully.")

    def fetch_and_store_tournaments(self, start_ts, end_ts):
        url = "https://topdeck.gg/api/v2/tournaments"
        api_token = settings.TOPDECK_API_KEY

        if not api_token:
            logger.error(
                "TOPDECK_API_KEY is not set in the environment or settings.")
            raise CommandError("TOPDECK_API_KEY is not set.")

        headers = {
            # Adjust the format as per API requirements
            'Authorization': f'{api_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            "game": "Magic: The Gathering",
            "format": "EDH",
            "start": start_ts,
            "end": end_ts,
            "columns": [
                "name",
                "decklist",
                "deckSnapshot",
                "commanders",
                "wins",
                "winsSwiss",
                "winsBracket",
                "winRate",
                "winRateSwiss",
                "winRateBracket",
                "draws",
                "losses",
                "lossesSwiss",
                "lossesBracket",
                "id"
            ]
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            logger.info(
                f"Successfully fetched data from API for timestamps {start_ts} to {end_ts}.")
        except requests.RequestException as e:
            logger.error(f"Error fetching data from API: {e}")
            raise CommandError(f"Error fetching data: {e}") from e

        try:
            data = response.json()
            logger.info(f"Received {len(data)} tournaments from API.")
        except ValueError as ve:
            logger.error("Failed to parse JSON response from API.")
            raise CommandError(
                "Failed to parse JSON response from API.") from ve

        tournaments_processed = 0

        # If the API returns a list of tournaments for this range
        for tour in data:
            # Create or update the tournament
            t, created = Tournament.objects.update_or_create(
                tid=tour.get('TID'),
                defaults={
                    'tournament_name': tour.get('tournamentName', ''),
                    'swiss_num': tour.get('swissNum', 0),
                    'start_date': tour.get('startDate', 0),
                    'game': tour.get('game', ''),
                    'format': tour.get('format', ''),
                    'top_cut': tour.get('topCut', 0)
                }
            )
            if created:
                logger.info(
                    f"Created new tournament: {t.tournament_name} (TID: {t.tid})")
            else:
                logger.info(
                    f"Updated tournament: {t.tournament_name} (TID: {t.tid})")

            # Clear old standings before re-importing to avoid duplicates
            previous_standings_count = t.standings.count()
            t.standings.all().delete()
            if previous_standings_count > 0:
                logger.info(
                    f"Deleted {previous_standings_count} previous standings for tournament: {t.tournament_name}")

            # Insert player standings
            player_objects = []
            for player in tour.get('standings', []):
                # Safely get and process 'decklist'
                decklist_raw = player.get('decklist')
                if decklist_raw is not None:
                    decklist = decklist_raw.strip()
                else:
                    decklist = ''

                # Safely get and process 'id'
                player_id_raw = player.get('id')
                if player_id_raw is not None:
                    player_id = player_id_raw.strip()
                else:
                    player_id = ''

                # Validate that decklist is a Moxfield URL
                if decklist:
                    if not decklist.startswith('https://www.moxfield.com/decks/'):
                        logger.warning(
                            f"Invalid decklist URL for player '{player.get('name')}' in tournament '{t.tournament_name}': {decklist}"
                        )
                        continue  # Skip this player
                else:
                    # If decklist is empty, set to None (since it's nullable)
                    decklist = None

                # Prepare PlayerStanding instance
                player_objects.append(PlayerStanding(
                    tournament=t,
                    name=player.get('name', '').strip(),
                    decklist=decklist,
                    wins=player.get('wins', 0),
                    wins_swiss=player.get('winsSwiss', 0),
                    wins_bracket=player.get('winsBracket', 0),
                    win_rate=player.get('winRate'),
                    win_rate_swiss=player.get('winRateSwiss'),
                    win_rate_bracket=player.get('winRateBracket'),
                    draws=player.get('draws', 0),
                    losses=player.get('losses', 0),
                    losses_swiss=player.get('lossesSwiss', 0),
                    losses_bracket=player.get('lossesBracket', 0),
                    player_id=player_id if player_id else None
                ))

            # Bulk create player standings for efficiency
            try:
                PlayerStanding.objects.bulk_create(player_objects)
                player_count = len(player_objects)
                logger.info(
                    f"Added {player_count} player standings for tournament: {t.tournament_name}")
                tournaments_processed += 1
            except ValidationError as ve:
                logger.error(
                    f"Validation error while adding player standings for tournament '{t.tournament_name}': {ve}")
            except Exception as e:
                logger.error(
                    f"Unexpected error while adding player standings for tournament '{t.tournament_name}': {e}")

        return tournaments_processed

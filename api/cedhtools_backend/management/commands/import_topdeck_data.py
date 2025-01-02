import logging
import requests
import re
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from cedhtools_backend.models import TopdeckTournament, TopdeckPlayerStanding
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetch tournaments data from topdeck.gg API in 6-month batches starting from June 1, 2022.'

    def add_arguments(self, parser):
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

        current_start = start_date
        current_end = start_date + relativedelta(months=1)

        while current_start < end_date:
            if current_end > end_date:
                current_end = end_date

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
                continue

            current_start = current_end
            current_end = current_start + relativedelta(months=1)

        logger.info("All tournament data imported/updated successfully.")

    def fetch_and_store_tournaments(self, start_ts, end_ts):
        url = settings.TOPDECK_API_BASE_URL + '/v2/tournaments'
        api_token = settings.TOPDECK_API_KEY

        if not api_token:
            logger.error(
                "TOPDECK_API_KEY is not set in the environment or settings.")
            raise CommandError("TOPDECK_API_KEY is not set.")

        headers = {
            'Authorization': f'{api_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            "game": "Magic: The Gathering",
            "format": "EDH",
            "start": start_ts,
            "end": end_ts,
            "columns": [
                "decklist",
                "wins",
                "draws",
                "losses",
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

        for tour in data:
            t, created = TopdeckTournament.objects.update_or_create(
                tid=tour.get('TID'),
                defaults={
                    'swiss_num': tour.get('swissNum', 0),
                    'start_date': tour.get('startDate', 0),
                    'top_cut': tour.get('topCut', 0),
                }
            )
            if created:
                logger.info(
                    f"Created new tournament: {t.tid}")
            else:
                logger.info(
                    f"Updated tournament: {t.tid}")

            previous_standings_count = t.standings.count()
            t.standings.all().delete()
            if previous_standings_count > 0:
                logger.info(
                    f"Deleted {previous_standings_count} previous standings for tournament: {t.tid}")

            player_objects = []
            for player in tour.get('standings', []):
                decklist = player.get('decklist')
                if decklist:
                    pattern = r'^(https?://)?(www\.)?moxfield\.com/decks/.*$'

                    if not re.match(pattern, decklist):
                        logger.warning(
                            f"Invalid decklist URL for player '{player.get('name')}' in tournament '{t.tid}': {decklist}"
                        )
                        continue
                else:
                    continue

                wins = player.get('wins')
                draws = player.get('draws')
                losses = player.get('losses')

                if (wins is None) or (draws is None) or (losses is None):
                    logger.warning(
                        f"Invalid wins/draws/losses for player '{player.get('name')}' in tournament '{t.tid}': {wins}-{draws}-{losses}"
                    )
                    continue
                else:
                    total_games = wins + draws + losses
                    if total_games == 0:
                        logger.warning(
                            f"Player '{player.get('name')}' in tournament '{t.tid}' has 0 total games played."
                        )
                        continue

                    else:
                        win_rate = wins / total_games
                        draw_rate = draws / total_games
                        loss_rate = losses / total_games
                    player_objects.append(TopdeckPlayerStanding(
                        tournament=t,
                        decklist=decklist,
                        wins=wins,
                        draws=draws,
                        losses=losses,
                        win_rate=win_rate,
                        draw_rate=draw_rate,
                        loss_rate=loss_rate
                    ))

            try:
                TopdeckPlayerStanding.objects.bulk_create(player_objects)
                player_count = len(player_objects)
                logger.info(
                    f"Added {player_count} player standings for tournament: {t.tid}")
                tournaments_processed += 1
            except ValidationError as ve:
                logger.error(
                    f"Validation error while adding player standings for tournament '{t.tid}': {ve}")
            except Exception as e:
                logger.error(
                    f"Unexpected error while adding player standings for tournament '{t.tid}': {e}")

        return tournaments_processed

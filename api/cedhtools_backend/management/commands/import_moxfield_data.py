import logging
import requests
import os
import time
import uuid
import re
from datetime import datetime
from dateutil.relativedelta import relativedelta
from urllib.parse import urlparse
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from cedhtools_backend.models import (
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldCard,
    MoxfieldDeckCard,
)
from tqdm import tqdm
from django.utils import timezone
import colorlog

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = colorlog.StreamHandler()
formatter = colorlog.ColoredFormatter(
    '%(log_color)s%(asctime)s [%(levelname)s] %(message)s',
    log_colors={
        'DEBUG': 'cyan',
        'INFO': 'green',
        'WARNING': 'yellow',
        'ERROR': 'red',
        'CRITICAL': 'bold_red',
    },
    datefmt='%Y-%m-%d %H:%M:%S'
)
handler.setFormatter(formatter)

if logger.hasHandlers():
    logger.handlers.clear()

logger.addHandler(handler)


class Command(BaseCommand):
    help = 'Import decklist data from Moxfield API and store it in the database.'

    def handle(self, *args, **options):
        # Get existing deck public IDs to filter out
        existing_deck_public_ids = set(
            MoxfieldDeck.objects.values_list('public_id', flat=True))

        # Fetch unique deck URLs, excluding those with existing decks
        deck_urls_to_skip = set()
        unique_deck_urls = []

        for url in TopdeckPlayerStanding.objects.values_list('decklist', flat=True).distinct():
            match = re.search(r'https://www\.moxfield\.com/decks/([^/]+)', url)
            if match:
                deck_id = match.group(1)
                if deck_id in existing_deck_public_ids:
                    deck_urls_to_skip.add(url)
                else:
                    unique_deck_urls.append(url)

        total_decks = len(unique_deck_urls)
        logger.info(f'Total unique decklist URLs to process: {total_decks}')

        user_agent = settings.MOXFIELD_USER_AGENT
        api_base_url = settings.MOXFIELD_API_BASE_URL

        if not user_agent:
            logger.error(
                'MOXFIELD_USER_AGENT is not set in the environment variables.')
            self.stdout.write(self.style.ERROR(
                'MOXFIELD_USER_AGENT is not set in the environment variables.'))
            return

        headers = {
            'User-Agent': user_agent
        }

        with tqdm(total=total_decks, desc='Processing decklists', unit='decklist') as pbar:
            try:
                for decklist_url in unique_deck_urls:
                    try:
                        logger.info(
                            f"Processing decklist {pbar.n + 1}/{total_decks}: {decklist_url}")

                        deck_id = self.get_deck_id(decklist_url)
                        if not deck_id:
                            logger.error(
                                f'Failed to extract deck ID from URL: {decklist_url}')
                            pbar.update(1)
                            continue

                        if MoxfieldDeck.objects.filter(public_id=deck_id).exists():
                            logger.info(
                                f'Deck already exists for URL: {decklist_url}')
                            pbar.update(1)
                            continue

                        api_url = f"{api_base_url}/decks/all/{deck_id}"

                        response = requests.get(
                            api_url, headers=headers, timeout=30)
                        response.raise_for_status()
                        deck_data = response.json()
                        with transaction.atomic():
                            deck = self.parse_deck(deck_data)
                            if deck:
                                TopdeckPlayerStanding.objects.filter(
                                    decklist=decklist_url).update(deck=deck)

                                logger.info(
                                    f'Successfully imported deck from URL: {decklist_url}')
                            else:
                                TopdeckPlayerStanding.objects.filter(
                                    decklist=decklist_url).delete()

                    except requests.exceptions.HTTPError as http_err:
                        if response.status_code == 404:
                            logger.warning(
                                f"Deck not found (404) for URL: {decklist_url}. Deleting associated player standing.")
                            TopdeckPlayerStanding.objects.filter(
                                decklist=decklist_url).delete()
                        else:
                            logger.error(
                                f"HTTP error occurred for URL {decklist_url}: {http_err}")
                    except requests.exceptions.RequestException as e:
                        logger.error(
                            f"Request error for URL {decklist_url}: {e}")
                    except Exception as e:
                        logger.exception(
                            f"Unexpected error for URL {decklist_url}: {e}")
                    finally:
                        pbar.update(1)

                    time.sleep(1)  # Maintain 1 request per second rate limit
            except KeyboardInterrupt:
                logger.warning("Import process interrupted by user.")
                self.stdout.write(self.style.WARNING(
                    "Import process interrupted by user. Exiting..."))
                return

        logger.info('All decklists have been processed.')

    def get_deck_id(self, deck_url):
        """
        Extracts the deck ID from the standard Moxfield deck URL.
        Example:
            Input: https://www.moxfield.com/decks/UC9RnVbdLU21nOXOexv_3g
            Output: UC9RnVbdLU21nOXOexv_3g
        """
        try:
            parsed_url = urlparse(deck_url)
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) >= 2 and path_parts[0] == 'decks':
                return path_parts[1]
            else:
                logger.error(f'Invalid deck URL format: {deck_url}')
                return None
        except Exception as e:
            logger.error(
                f'Error parsing deck ID from URL {deck_url}: {str(e)}')
            return None

    def parse_deck(self, deck_data):
        """
        Parses the deck data from Moxfield API and stores it in the database.
        Returns the Deck instance.
        """

        format = deck_data.get('format')
        if format != 'commander':
            print(
                f"Deck {deck_data.get('publicUrl')} is not a commander deck, deleting the player standings associated")
            return None

        boards = deck_data.get('boards', {})
        mainboard_count = boards.get('mainboard', {}).get('count', 0)
        commanders_count = boards.get('commanders', {}).get('count', 0)
        companions_count = boards.get('companions', {}).get('count', 0)

        if mainboard_count + commanders_count + companions_count != 100:
            print(
                f"Deck {deck_data.get('publicUrl')} does not have exactly 100 cards, deleting the player standings associated")
            return

        deck, created = MoxfieldDeck.objects.update_or_create(
            id=deck_data.get('id'),
            defaults={
                'public_id': deck_data.get('publicId'),
            }
        )

        for board_name, board_data in boards.items():
            if board_name not in ['mainboard', 'commanders', 'companions']:
                continue

            for card_key, card_data in board_data.get('cards', {}).items():
                card_info = card_data.get('card')
                quantity = card_data.get('quantity', 1)
                self.get_or_create_card(
                    card_info=card_info,
                    deck=deck,
                    board_name=board_name,
                    quantity=quantity
                )

        return deck

    def get_or_create_card(self, card_info, deck, board_name, quantity=1):
        """
        Retrieves an existing MoxfieldCard or creates a new one and associates it with the deck.

        Args:
            card_info: Dictionary containing card information from Moxfield API
            deck: MoxfieldDeck instance
            board_name: String indicating which part of the deck (mainboard, commanders, etc.)
            quantity: Integer representing how many copies of this card to add
        """
        card, created = MoxfieldCard.objects.get_or_create(
            id=card_info.get('id', ''),
            defaults={
                'unique_card_id': card_info.get('uniqueCardId', ''),
                'scryfall_id': self.parse_uuid(card_info.get('scryfall_id', '')),
            }
        )

        deck_card, created = MoxfieldDeckCard.objects.get_or_create(
            deck=deck,
            card=card,
            board=board_name,
            defaults={'quantity': quantity}
        )

        if not created:
            deck_card.quantity = quantity
            deck_card.save()

        return card

    def parse_uuid(self, uuid_str):
        """
        Parses a UUID string into a Python UUID object.
        """
        if not uuid_str:
            return None
        try:
            return uuid.UUID(uuid_str)
        except ValueError:
            logger.warning(
                f"Invalid UUID format: {uuid_str}. Skipping export_id.")
            return None

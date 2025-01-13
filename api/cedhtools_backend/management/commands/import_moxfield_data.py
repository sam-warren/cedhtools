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
    ScryfallCard
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
        # existing_deck_public_ids = set(
        #     MoxfieldDeck.objects.values_list('public_id', flat=True))

        # Fetch unique deck URLs, excluding those with existing decks
        deck_urls_to_skip = set()
        unique_deck_urls = []
        for url in TopdeckPlayerStanding.objects.values_list('decklist', flat=True).distinct():
            # Add type checking and filtering
            if not url or not isinstance(url, str):
                continue

            match = re.search(r'.*moxfield\.com/decks/([^/]+)', url)
            if match:
                # deck_id = match.group(1)
                # if deck_id in existing_deck_public_ids:
                #     deck_urls_to_skip.add(url)
                # else:
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
                            logger.warning(
                                f'Failed to extract deck ID from URL: {decklist_url}. Skipping...')

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

                    except requests.exceptions.HTTPError as http_err:
                        if response.status_code == 404:
                            logger.warning(
                                f"Deck not found (404) for URL: {decklist_url}")

                        else:
                            logger.error(
                                f"HTTP error occurred for URL {decklist_url}: {http_err}")
                    except requests.exceptions.RequestException as e:
                        logger.error(
                            f"Request error for URL {decklist_url}: {e}. Skipping...")

                    except Exception as e:
                        logger.exception(
                            f"Unexpected error for URL {decklist_url}: {e}. Skipping...")

                    finally:
                        pbar.update(1)

                    time.sleep(0.5)
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
        # Strip any whitespace from the URL first
        deck_url = deck_url.strip()

        try:
            parsed_url = urlparse(deck_url)

            # Modified check to allow both moxfield.com and www.moxfield.com
            if parsed_url.netloc not in ['moxfield.com', 'www.moxfield.com']:
                logger.error(f'Not a Moxfield URL: {deck_url}')
                return None

            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) >= 2 and path_parts[0] == 'decks':
                deck_id = path_parts[1]

                # Optional: Add a length check for deck ID
                if len(deck_id) > 0:
                    return deck_id
                else:
                    logger.error(f'Empty deck ID in URL: {deck_url}')
                    return None
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
        Returns None if any card in the deck lacks a valid Scryfall reference.
        """
        format = deck_data.get('format')
        if format != 'commander':
            logger.info(
                f"Deck {deck_data.get('publicUrl')} is not a commander deck"
            )
            return None

        boards = deck_data.get('boards', {})
        mainboard_count = boards.get('mainboard', {}).get('count', 0)
        commanders_count = boards.get('commanders', {}).get('count', 0)
        companions_count = boards.get('companions', {}).get('count', 0)

        if mainboard_count + commanders_count + companions_count != 100:
            logger.info(
                f"Deck {deck_data.get('publicUrl')} does not have exactly 100 cards"
            )
            return None

        with transaction.atomic():
            deck, created = MoxfieldDeck.objects.get_or_create(
                id=deck_data.get('id'),
                defaults={
                    'public_id': deck_data.get('publicId'),
                    'name': deck_data.get('name'),
                    'colors': deck_data.get('colors', []),
                    'color_identity': deck_data.get('colorIdentity', []),
                }
            )

            valid_cards = True
            for board_name, board_data in boards.items():
                if board_name not in ['mainboard', 'commanders', 'companions']:
                    continue

                for card_key, card_data in board_data.get('cards', {}).items():
                    card_info = card_data.get('card')
                    quantity = card_data.get('quantity', 1)
                    card = self.get_or_create_card(
                        card_info=card_info,
                        deck=deck,
                        board_name=board_name,
                        quantity=quantity
                    )

                    if card is None:
                        valid_cards = False
                        break

                if not valid_cards:
                    break

            if not valid_cards:
                logger.warning(
                    f"Deck {deck_data.get('publicUrl')} contains invalid cards. Skipping..."
                )
                return None

            return deck

    def get_or_create_card(self, card_info, deck, board_name, quantity=1):
        """
        Retrieves an existing MoxfieldCard or creates a new one and associates it with the deck.
        Includes multiple fallback methods to find the correct Scryfall card.
        """
        # First, try the original Scryfall ID
        original_scryfall_id = self.parse_uuid(
            card_info.get('scryfall_id', ''))

        # If original Scryfall ID exists and is valid, use it
        if original_scryfall_id:
            try:
                scryfall_card = ScryfallCard.objects.get(
                    id=original_scryfall_id)
                if scryfall_card.legality != 'not_legal':
                    return self._create_moxfield_card(scryfall_card, card_info, deck, board_name, quantity)
            except ScryfallCard.DoesNotExist:
                logger.warning(
                    "Could not find Scryfall card by ID, broadening search...")
                pass

        # Fallback 1: Search by name and collector number
        try:
            # Extract relevant details from card_info
            card_name = card_info.get('name')
            set_code = card_info.get('set')
            collector_number = card_info.get('cn')

            # Try to find a match using name, set, and collector number
            if card_name and set_code and collector_number:
                scryfall_card = ScryfallCard.objects.get(
                    name=card_name,
                    collector_number=collector_number,
                    released_at__year=card_info.get('released_at', '').split(
                        '-')[0] if card_info.get('released_at') else None
                )

                if scryfall_card.legality != 'not_legal':
                    logger.info(
                        f"Found Scryfall card by name and collector number: {card_name} ({set_code} - {collector_number})")
                    return self._create_moxfield_card(scryfall_card, card_info, deck, board_name, quantity)
        except ScryfallCard.DoesNotExist:
            logger.warning(
                "Could not find Scryfall card by name and collector number. Broadening search...")
            pass
        except ScryfallCard.MultipleObjectsReturned:
            # If multiple cards match, try to narrow down
            logger.warning(
                "Multiple Scryfall cards found by name and collector number. Broadening search...")
            try:
                scryfall_card = ScryfallCard.objects.get(
                    name=card_name,
                    collector_number=collector_number,
                    layout=card_info.get('layout', '')
                )

                if scryfall_card.legality != 'not_legal':
                    logger.info(
                        f"Found Scryfall card by name, collector number, and layout: {card_name} ({set_code} - {collector_number})")
                    return self._create_moxfield_card(scryfall_card, card_info, deck, board_name, quantity)
            except Exception:
                logger.warning(
                    "Could not find Scryfall card by name, collector number, and layout. Broadening search..."
                )
                pass

        # Fallback 2: Search by name only
        try:
            # Get all cards with this name
            possible_cards = ScryfallCard.objects.filter(name=card_name)

            # If only one card exists, use it
            if possible_cards.count() == 1 and possible_cards[0].legality != 'not_legal':
                logger.info(
                    f"Found Scryfall card by name only: {card_name}")
                return self._create_moxfield_card(possible_cards[0], card_info, deck, board_name, quantity)

            # If multiple cards exist, try to find the most recent one
            if possible_cards.exists():
                # Sort by released date, get the most recent
                recent_card = possible_cards.order_by('-released_at').first()
                if recent_card and recent_card.legality != 'not_legal':
                    logger.info(
                        f"Found most recent Scryfall card by name: {card_name}"
                    )
                    return self._create_moxfield_card(recent_card, card_info, deck, board_name, quantity)
        except Exception:
            pass

        # If all fallback methods fail, log and return None
        logger.error(
            f"Could not find Scryfall card for: {card_info.get('name')} (Set: {card_info.get('set')}, Collector Number: {card_info.get('cn')})"
        )
        return None

    def _create_moxfield_card(self, scryfall_card, card_info, deck, board_name, quantity=1):
        """
        Helper method to create MoxfieldCard and MoxfieldDeckCard entries
        """
        try:
            card, created = MoxfieldCard.objects.get_or_create(
                id=card_info.get('id', ''),
                defaults={
                    'unique_card_id': card_info.get('uniqueCardId', ''),
                    'scryfall_card': scryfall_card,
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
        except Exception as e:
            logger.error(
                f"Error creating card {card_info.get('id')}: {str(e)}")
            return None

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

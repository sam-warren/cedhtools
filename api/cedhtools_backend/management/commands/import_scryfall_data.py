import logging
import requests
import json
import gzip
from io import BytesIO
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from ...models import ScryfallCard
from tqdm import tqdm
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
    help = 'Import default cards data from Scryfall bulk data API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Number of cards to process in each database transaction'
        )
        parser.add_argument(
            '--force-update',
            action='store_true',
            help='Force update all cards even if they exist'
        )

    def handle(self, *args, **options):
        try:
            bulk_info = self._fetch_default_cards_info()
            logger.info(
                f"Downloading bulk data from: {bulk_info['download_uri']}")

            cards_data = self._download_bulk_data(bulk_info['download_uri'])
            logger.info(f"Processing {len(cards_data)} cards")

            self._process_cards(cards_data, batch_size=options['batch_size'],
                                force_update=options['force_update'])

            logger.info("Bulk data import completed successfully")

        except Exception as e:
            logger.error(f"An error occurred during import: {str(e)}")
            raise

    def _fetch_default_cards_info(self):
        """Fetch default cards bulk data information."""
        response = requests.get(
            f"{settings.SCRYFALL_API_BASE_URL}/bulk-data/default-cards",
            headers={"User-Agent": settings.SCRYFALL_USER_AGENT}
        )
        response.raise_for_status()
        return response.json()

    def _download_bulk_data(self, download_uri):
        """Download and decompress the bulk data file."""
        logger.info("Downloading bulk data file...")
        response = requests.get(
            download_uri,
            headers={"User-Agent": settings.SCRYFALL_USER_AGENT},
            stream=True
        )
        response.raise_for_status()

        with gzip.GzipFile(fileobj=BytesIO(response.content)) as gz:
            data = json.loads(gz.read().decode('utf-8'))

        return data

    def _process_cards(self, cards_data, batch_size=1000, force_update=False):
        """Process cards in batches and save to database."""
        total_cards = len(cards_data)
        processed_cards = 0

        with tqdm(total=total_cards, desc="Processing cards", unit="cards") as pbar:
            while processed_cards < total_cards:
                batch = cards_data[processed_cards:processed_cards + batch_size]
                self._process_batch(batch, force_update)
                processed_cards += len(batch)
                pbar.update(len(batch))

    def _process_batch(self, batch, force_update):
        """Process a batch of cards and save to database, excluding specific layouts."""
        # Layouts to ignore
        ignored_layouts = [
            'planar', 'scheme', 'vanguard', 'token',
            'double_faced_token', 'emblem', 'augment',
            'host', 'art_series'
        ]

        with transaction.atomic():
            for card_data in batch:
                # Skip cards with ignored layouts
                if card_data.get('layout') in ignored_layouts:
                    logger.debug(
                        f"Skipping card {card_data.get('name')} with layout {card_data.get('layout')}")
                    continue

                try:
                    self._save_card(card_data, force_update)
                except Exception as e:
                    logger.error(
                        f"Error processing card {card_data.get('name')}: {str(e)}")

    def _flatten_card_data(self, card_data):
        """
        Flatten card data based on its layout, handling multi-faced cards intelligently
        """
        layout = card_data.get('layout', 'normal')

        # For layouts with card_faces, we'll need special handling
        multi_face_layouts = [
            'split', 'flip', 'transform', 'modal_dfc',
            'adventure', 'meld', 'reversible_card'
        ]

        # Default to core-level data
        defaults = {
            'id': card_data['id'],
            'scryfall_uri': card_data.get('scryfall_uri', ''),
            'layout': layout,
            'legalities': card_data.get('legalities', {}),
            'image_uris': card_data.get('image_uris', {})
        }

        # Handle different layouts
        if layout in multi_face_layouts and 'card_faces' in card_data:
            faces = card_data['card_faces']

            # Composite name (for split/transform cards)
            defaults['name'] = ' // '.join(face['name'] for face in faces)

            # Composite type line
            defaults['type_line'] = ' // '.join(face.get('type_line', '')
                                                for face in faces)

            # Handle mana cost and CMC
            face_mana_costs = [face.get('mana_cost', '') for face in faces]
            defaults['mana_cost'] = ' // '.join(face_mana_costs)

            # Use first face's CMC for multi-faced cards or sum CMCs
            defaults['cmc'] = sum(face.get('cmc', 0) for face in faces)

            # Prefer card_faces image_uris if available
            defaults['image_uris'] = faces[0].get('image_uris', {})

        else:
            # Single-face or standard layouts
            defaults.update({
                'name': card_data['name'],
                'type_line': card_data.get('type_line', ''),
                'mana_cost': card_data.get('mana_cost', ''),
                'cmc': card_data.get('cmc', 0.0)
            })

        return defaults

    def _save_card(self, card_data, force_update):
        """Save or update a single card in the database."""
        defaults = self._flatten_card_data(card_data)

        if force_update:
            ScryfallCard.objects.update_or_create(
                id=defaults['id'],
                defaults=defaults
            )
        else:
            ScryfallCard.objects.get_or_create(
                id=defaults['id'],
                defaults=defaults
            )

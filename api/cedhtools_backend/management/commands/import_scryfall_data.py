"""
Management command to import card data from Scryfall's bulk data API.
Handles both gzipped and non-gzipped responses, with proper error handling and logging.
"""

import logging
import requests
import json
import gzip
from io import BytesIO
from typing import Dict, List, Any, Optional
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from ...models import ScryfallCard
from tqdm import tqdm
import colorlog

# Logger configuration
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
    """Django command to import Scryfall card data."""

    help = 'Import default cards data from Scryfall bulk data API'

    # Layouts to ignore during processing
    IGNORED_LAYOUTS = {
        'planar', 'scheme', 'vanguard', 'token',
        'double_faced_token', 'emblem', 'augment',
        'host', 'art_series'
    }

    def add_arguments(self, parser):
        """Add command line arguments."""
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

    def _calculate_type(self, type_line: Optional[str]) -> Optional[str]:
        """Calculate card type from type_line."""
        if not type_line:
            return None

        type_text = type_line.split(
            '//')[0].strip() if '//' in type_line else type_line
        main_type_section = type_text.split(
            '—')[0] if '—' in type_text else type_text
        words = {word.strip() for word in main_type_section.split()}

        type_categories = [
            "Battle", "Planeswalker", "Creature", "Land",
            "Sorcery", "Instant", "Artifact", "Enchantment"
        ]

        for category in type_categories:
            if category in words:
                return category
        return None

    def _validate_array_field(self, data: Any) -> List[str]:
        """Validate and clean array field data."""
        if not data:
            return []
        if isinstance(data, list):
            return [str(item) for item in data if item]
        return []

    def handle(self, *args, **options):
        """Execute the command."""
        try:
            bulk_info = self._fetch_bulk_data_info()
            logger.info(
                f"Downloading bulk data from: {bulk_info['download_uri']}")

            raw_data = self._download_data(bulk_info['download_uri'])
            cards_data = self._parse_response_data(raw_data)

            logger.info(f"Processing {len(cards_data)} cards")
            self._process_cards(
                cards_data,
                batch_size=options['batch_size'],
                force_update=options['force_update']
            )

            logger.info("Bulk data import completed successfully")

        except Exception as e:
            logger.error(f"An error occurred during import: {str(e)}")
            raise

    def _fetch_bulk_data_info(self) -> Dict[str, Any]:
        """Fetch bulk data information from Scryfall API."""
        response = requests.get(
            f"{settings.SCRYFALL_API_BASE_URL}/bulk-data/default-cards",
            headers={"User-Agent": settings.SCRYFALL_USER_AGENT}
        )
        response.raise_for_status()
        return response.json()

    def _download_data(self, download_uri: str) -> bytes:
        """Download data from the provided URI."""
        logger.info("Downloading bulk data file...")
        response = requests.get(
            download_uri,
            headers={"User-Agent": settings.SCRYFALL_USER_AGENT},
            stream=True
        )
        response.raise_for_status()
        return response.content

    def _parse_response_data(self, raw_data: bytes) -> List[Dict[str, Any]]:
        """
        Parse the response data, handling both gzipped and non-gzipped content.
        """
        try:
            # Try to parse as gzipped data first
            with gzip.GzipFile(fileobj=BytesIO(raw_data)) as gz:
                return json.loads(gz.read().decode('utf-8'))
        except gzip.BadGzipFile:
            # If not gzipped, try parsing as regular JSON
            return json.loads(raw_data.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON data: {e}")
            raise

    def _process_cards(
        self,
        cards_data: List[Dict[str, Any]],
        batch_size: int = 1000,
        force_update: bool = False
    ):
        """Process cards in batches with progress tracking."""
        total_cards = len(cards_data)
        processed_cards = 0

        with tqdm(total=total_cards, desc="Processing cards", unit="cards") as pbar:
            while processed_cards < total_cards:
                batch = cards_data[processed_cards:processed_cards + batch_size]
                self._process_batch(batch, force_update)
                processed_cards += len(batch)
                pbar.update(len(batch))

    def _process_batch(self, batch: List[Dict[str, Any]], force_update: bool):
        """Process a batch of cards using bulk operations."""
        with transaction.atomic():
            cards_to_create = []
            cards_to_update = []

            for card_data in batch:
                if card_data.get('layout') in self.IGNORED_LAYOUTS:
                    continue

                try:
                    defaults = self._flatten_card_data(card_data)
                    card_id = defaults['id']

                    if force_update:
                        cards_to_update.append(ScryfallCard(
                            **defaults
                        ))
                    else:
                        # Check if card exists
                        if not ScryfallCard.objects.filter(id=card_id).exists():
                            cards_to_create.append(ScryfallCard(
                                **defaults
                            ))

                except Exception as e:
                    logger.error(
                        f"Error processing card {card_data.get('name')}: {str(e)}"
                    )

            # Bulk create/update
            if cards_to_create:
                ScryfallCard.objects.bulk_create(
                    cards_to_create,
                    ignore_conflicts=True
                )

            if cards_to_update:
                ScryfallCard.objects.bulk_update(
                    cards_to_update,
                    fields=[
                        'name', 'scryfall_uri', 'layout', 'type_line',
                        'type', 'mana_cost', 'cmc', 'legality',
                        'image_uris', 'released_at', 'collector_number',
                        'colors', 'color_identity'
                    ]
                )

    def _flatten_card_data(self, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flatten card data based on its layout."""
        layout = card_data.get('layout', 'normal')

        commander_legality = card_data.get(
            'legalities', {}).get('commander', 'not_legal')

        released_at_str = card_data.get('released_at')
        try:
            released_at = datetime.strptime(
                released_at_str, '%Y-%m-%d').date() if released_at_str else None
        except ValueError:
            logger.warning(
                f"Invalid release date format for card {card_data.get('name')}: {released_at_str}")
            released_at = None

        defaults = {
            'id': card_data['id'],
            'name': card_data['name'],
            'scryfall_uri': card_data.get('scryfall_uri', ''),
            'layout': layout,
            'legality': commander_legality,
            'released_at': released_at,
            'collector_number': card_data.get('collector_number', ''),
            'colors': self._validate_array_field(card_data.get('colors')),
            'color_identity': self._validate_array_field(card_data.get('color_identity'))
        }

        # Process layout-specific data (including type_line for multi-faced cards)
        processed_data = self._process_card_layout(layout, card_data)
        defaults.update(processed_data)

        # Calculate type after processing card layout to use the final type_line
        defaults['type'] = self._calculate_type(defaults.get('type_line', ''))

        return defaults

    def _process_card_layout(self, layout: str, card_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process card data based on its layout."""
        processed_data = {
            'type_line': card_data.get('type_line', ''),
            'cmc': float(card_data.get('cmc', 0)),
            'mana_cost': card_data.get('mana_cost', ''),
            'image_uris': card_data.get('image_uris', {}),
        }

        card_faces = card_data.get('card_faces', [])
        if not isinstance(card_faces, list):
            logger.warning(
                f"Unexpected card_faces type for card: {card_data.get('name', 'Unknown')}")
            return processed_data

        if layout in ['transform', 'modal_dfc', 'reversible_card'] and len(card_faces) > 1:
            try:
                if layout in ['transform', 'modal_dfc']:
                    front = card_faces[0]
                    back = card_faces[1]

                    type_front = front.get('type_line', '').strip()
                    type_back = back.get('type_line', '').strip()

                    if type_front and type_back and type_front != '' and type_back != '':
                        processed_data['type_line'] = f"{type_front} // {type_back}"
                    else:
                        processed_data['type_line'] = type_front

                    mana_cost_front = front.get('mana_cost', '').strip()
                    mana_cost_back = back.get('mana_cost', '').strip()
                    if mana_cost_front and mana_cost_back and mana_cost_front != '' and mana_cost_back != '':
                        processed_data['mana_cost'] = f"{mana_cost_front} // {mana_cost_back}"
                    else:
                        processed_data['mana_cost'] = mana_cost_front

                    processed_data['image_uris'] = front.get('image_uris', {})

                else:  # reversible_card
                    front = card_faces[0]
                    processed_data.update({
                        'name': front.get('name', card_data['name']),
                        'type_line': front.get('type_line', ''),
                        'cmc': float(front.get('cmc', 0)),
                        'mana_cost': front.get('mana_cost', ''),
                        'image_uris': front.get('image_uris', {}),
                    })
            except Exception as e:
                logger.error(
                    f"Error processing multi-faced card {card_data.get('name', 'Unknown')}: {e}")
                logger.error(f"Card faces: {card_faces}")

        return processed_data

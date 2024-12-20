import requests
import time
from django.core.management.base import BaseCommand
from ...models import ScryfallCard


class Command(BaseCommand):
    help = "Imports Scryfall bulk data into the database."

    BULK_DATA_URL = "https://api.scryfall.com/bulk-data/unique-artwork"

    def fetch_bulk_data_url(self):
        """Fetch the download URL for the unique artwork bulk data."""
        response = requests.get(self.BULK_DATA_URL)
        response.raise_for_status()
        data = response.json()
        return data['download_uri']

    def download_bulk_data(self, download_url):
        """Download the bulk data JSON from the provided URL."""
        self.stdout.write(f"Downloading bulk data from {download_url}...")
        response = requests.get(download_url, stream=True)
        response.raise_for_status()
        return response.json()

    def process_card(self, card):
        """Process and save a single card into the database."""
        ScryfallCard.objects.update_or_create(
            scryfall_id=card['id'],
            defaults={
                'oracle_id': card.get('oracle_id'),
                'name': card['name'],
                'lang': card['lang'],
                'released_at': card['released_at'],
                'set_name': card['set_name'],
                'collector_number': card['collector_number'],
                'rarity': card['rarity'],
                'uri': card['uri'],
                'scryfall_uri': card['scryfall_uri'],
                'image_uris': card.get('image_uris', {}),
                'mana_cost': card.get('mana_cost', ''),
                'cmc': card.get('cmc', 0.0),
                'type_line': card.get('type_line', ''),
                'oracle_text': card.get('oracle_text', ''),
                'power': card.get('power'),
                'toughness': card.get('toughness'),
                'colors': card.get('colors', []),
                'color_identity': card.get('color_identity', []),
                'legalities': card.get('legalities', {}),
                'prices': card.get('prices', {}),
                'digital': card.get('digital', False),
                'reprint': card.get('reprint', False),
                'full_art': card.get('full_art', False),
                'textless': card.get('textless', False),
                'set_id': card['set_id'],
            }
        )

    def handle(self, *args, **kwargs):
        self.stdout.write("Fetching bulk data URL...")
        download_url = self.fetch_bulk_data_url()

        self.stdout.write("Downloading and processing bulk data...")
        bulk_data = self.download_bulk_data(download_url)

        self.stdout.write("Importing cards into the database...")

        for idx, card in enumerate(bulk_data):
            self.process_card(card)
            if idx % 100 == 0:
                self.stdout.write(f"Processed {idx} cards...")

        self.stdout.write(self.style.SUCCESS(
            "Successfully imported Scryfall data!"))

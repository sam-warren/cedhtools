import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import ScryfallCard, ScryfallCardFace


class Command(BaseCommand):
    help = "Imports Scryfall bulk data into the database."

    BULK_DATA_URL = settings.SCRYFALL_API_BASE_URL + "/bulk-data/default-cards"

    def fetch_bulk_data_url(self):
        """Fetch the download URL for the default cards bulk data."""
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
        # Insert or update the main card
        scryfall_card, _ = ScryfallCard.objects.update_or_create(
            scryfall_id=card["id"],
            defaults={
                "oracle_id": card.get("oracle_id"),
                "name": card["name"],
                "lang": card.get("lang"),
                "released_at": card.get("released_at"),
                "set_id": card.get("set_id"),
                "set_name": card.get("set_name"),
                "collector_number": card.get("collector_number"),
                "rarity": card.get("rarity"),
                "layout": card.get("layout"),
                "uri": card.get("uri"),
                "scryfall_uri": card.get("scryfall_uri"),
                "cmc": card.get("cmc", 0.0),
                "colors": card.get("colors", []),
                "color_identity": card.get("color_identity", []),
                "legalities": card.get("legalities", {}),
                "keywords": card.get("keywords", []),
                "prices": card.get("prices", {}),
                "digital": card.get("digital", False),
                "reprint": card.get("reprint", False),
                "full_art": card.get("full_art", False),
                "textless": card.get("textless", False),
                "story_spotlight": card.get("story_spotlight", False),
            },
        )

        # Process card faces
        if card.get("layout") in ["modal_dfc", "transform", "adventure"]:
            card_faces = card.get("card_faces", [])
            for face_data in card_faces:
                ScryfallCardFace.objects.update_or_create(
                    card=scryfall_card,
                    name=face_data.get("name"),
                    defaults={
                        "mana_cost": face_data.get("mana_cost"),
                        "type_line": face_data.get("type_line"),
                        "oracle_text": face_data.get("oracle_text"),
                        "power": face_data.get("power"),
                        "toughness": face_data.get("toughness"),
                        "loyalty": face_data.get("loyalty"),
                        "colors": face_data.get("colors", []),
                        "image_uris": face_data.get("image_uris", {}),
                    },
                )
        else:
            # Single-faced cards can have a default face entry if needed
            ScryfallCardFace.objects.update_or_create(
                card=scryfall_card,
                name=card["name"],
                defaults={
                    "mana_cost": card.get("mana_cost"),
                    "type_line": card.get("type_line"),
                    "oracle_text": card.get("oracle_text"),
                    "power": card.get("power"),
                    "toughness": card.get("toughness"),
                    "loyalty": card.get("loyalty"),
                    "colors": card.get("colors", []),
                    "image_uris": card.get("image_uris", {}),
                },
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

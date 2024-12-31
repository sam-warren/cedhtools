import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import ScryfallCard, ScryfallCardFace


class Command(BaseCommand):
    help = "Imports Scryfall bulk data into the database."

    BULK_DATA_URL = settings.SCRYFALL_API_BASE_URL + "/bulk-data/default-cards"
    SCRYFALL_USER_AGENT = settings.SCRYFALL_USER_AGENT

    headers = {
        'User-Agent': SCRYFALL_USER_AGENT,
        'Accept': 'application/json;q=0.9,*/*;q=0.8'
    }

    # Create a list dfc_keys describing the card layouts that have a card_faces property:
    # split, flip, transform, and double_faced_token will always have a card_faces property
    # split: normal magic back, ex. Wear // Tear. card_faces contains data on what each mode does, image_uris in root
    # flip: normal magic back, ex. Erayo, Soratami Ascendant // Erayo's Essence, card_faces contains what each split does, image_uris in root
    # transform: a magic card with two sides. ex. Delver of Secrets // Insectile Aberration, card_faces contains the two sides, each of which has their own image_uris.
    # modal_dfc: a magic card with two sides, but you can only play one side. ex. Agadeem's Awakening // Agadeem, the Undercrypt. card_faces contains the two sides, each of which has their own image_uris.
    # reversible_card: a magic card with two sides with functionally identical rules text and deckbuilding restrictions. Each card_face has its own layout, image_uris.

    # ScryfallCard:

    # --- CORE FIELDS ---
    # arena_id?: integer
    # id: UUID - scryfall_id
    # lang: string
    # mtgo_id?: integer
    # mtgo_foil_id?: integer
    # multiverse_ids?: integer[]
    # tcgplayer_id?: integer
    # tcgplayer_etched_id?: integer
    # cardmarket_id?: integer
    # object: string (always 'card')
    # layout: string (one of: normal, split, flip, transform, modal_dfc, meld, leveler, class, case, saga, adventure, mutate, prototype, battle, planar, scheme, vanguard, token, double_faced_token, emblem, augment, host, art_series, reversible_card)
    # oracle_id?: UUID
    # prints_search_uri: URI
    # rulings_uri: URI
    # scryfall_uri: URI
    # uri: URI

    # --- GAMEPLAY FIELDS ---
    # all_parts?: RelatedCard[]
    # card_faces?: CardFace[]
    # cmc: number
    # color_identity: Colors
    # color_indicator?: Colors
    # colors?: Colors
    # defense?: string
    # edhrec_rank?: integer
    # hand_modifier?: string
    # keywords?: string[]
    # legalities: An object describing the legality of this card across play formats. Possible legalities are: legal, not_legal, restricted, and banned.
    # life_modifier?: string
    # loyalty?: string
    # mana_cost?: string
    # name: string - The name of this card. If this card has multiple faces, this field will contain both names separated by ␣//␣.
    # oracle_text?: string
    # penny_rank?: integer
    # power?: string
    # produced_mana?: Colors
    # reserved?: boolean
    # type_line: string

    # --- PRINT FIELDS ---
    # artist?: string
    # artist_ids?: string[]
    # attraction_lights?: string[]
    # booster: boolean
    # border_color: string
    # card_back_id: UUID - The UUID of the card back design object on Scryfall’s API.
    # content_warning?: boolean
    # digital: boolean
    # finishes: An array of computer-readable flags that indicate if this card can come in foil, nonfoil, or etched finishes.
    # flavor_name?: string
    # flavor_text?: string
    # frame_effects?: string[] - choices from (legendary, miracle, enchantment, draft, devoid, tombstone, colorshifted, inverted, sunmoondfc, compasslanddfc, originpwdfc, mooneldrazidfc, waxingandwaningmoondfc, showcase, extendedart, companion,
    # etched, snow, lesson, shatteredglass, convertdfc, fandfc, upsidedowndfc, spree)
    # frame: string - one of (1993, 1997, 2003, 2015, future)
    # full_art: boolean
    # games: string[] - choices from (paper, arena, mtgo)
    # highres_image: boolean
    # illustration_id?: UUID
    # image_status: string, A computer-readable indicator for the state of this card’s image, one of missing, placeholder, lowres, or highres_scan.
    # image_uris: ImageURIs
    # oversized: boolean
    # prices: Prices
    # printed_name?: string
    # printed_text?: string
    # printed_type_line?: string
    # promo: boolean
    # promo_types?: string[]
    # purchase_uris: PurchaseURIs
    # rarity: string
    # related_uris: RelatedURIs
    # released_at: string
    # reprint: boolean
    # scryfall_set_uri: URI
    # set_name: string
    # set_search_uri: URI
    # set_type: string
    # set_uri: URI
    # set: string - set code
    # set_id: UUID - set object UUID
    # story_spotlight: boolean
    # textless: boolean
    # variation: boolean
    # variation_of?: UUID
    # security_stamp?: string
    # watermark?: string
    # preview: Preview

    # --- CARD FACE OBJECTS ---
    # artist?: string
    # artist_id?: UUID
    # cmc?: number
    # color_indicator?: Colors
    # colors?: Colors
    # defense?: string
    # flavor_text?: string
    # illustration_id?: UUID
    # image_uris?: ImageURIs - An object providing URIs to imagery for this face, if this is a double-sided card. If this card is not double-sided, then the image_uris property will be part of the parent object instead.
    # layout?: string - The layout of this card face, if the card is reversible.
    # loyalty?: string
    # mana_cost: string
    # name: string
    # object: content type for this object, always card_face
    # oracle_id?: UUID
    # oracle_text?: string
    # power?: string
    # printed_name?: string
    # printed_text?: string
    # printed_type_line?: string
    # toughness?: string
    # type_line?: string
    # watermark?: string

    # --- RELATED CARDS OBJECT ---
    # id: UUID
    # object: string - always related_card
    # component: string - one of token, meld_part, meld_result, or combo_piece
    # name: string
    # type_line: string
    # uri: URI

    def fetch_bulk_data_url(self):
        """Fetch the download URL for the default cards bulk data."""
        response = requests.get(self.BULK_DATA_URL, headers=self.headers)
        response.raise_for_status()
        data = response.json()
        return data['download_uri']

    def download_bulk_data(self, download_url):
        """Download the bulk data JSON from the provided URL."""
        self.stdout.write(f"Downloading bulk data from {download_url}...")
        response = requests.get(
            download_url, stream=True, headers=self.headers)
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

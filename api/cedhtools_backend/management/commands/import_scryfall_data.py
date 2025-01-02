import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import ScryfallCard, ScryfallCardFace
from ...constants import CardLayout


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
        layout = card.get("layout")
        # if layout:
        # if layout is CardLayout.REVERSIBLE_CARD:
        # cmc, colors, mana_cost, oracle_text, power, toughness, type_line MISSING from core fields, present on each of the card_faces objects.
        # id, name, uri, layout, color_identity, keywords, legalities,
        # Special case for reversible cards. Reversible cards have the shape:
        # {
        #     "id": "018830b2-dff9-45f3-9cc2-dc5b2eec0e54", NOTE PRESENT
        #     "name": "Jinnie Fay, Jetmir's Second // Jinnie Fay, Jetmir's Second", NOTE PRESENT
        #     "uri": "https://api.scryfall.com/cards/018830b2-dff9-45f3-9cc2-dc5b2eec0e54", NOTE PRESENT
        #     "layout": "reversible_card", NOTE PRESENT
        #     "color_identity": [ NOTE PRESENT
        #         "G",
        #         "R",
        #         "W"
        #     ],
        #     "keywords": [], NOTE PRESENT
        #     NOTE: cmc MISSING from core fields
        #     NOTE: colors MISSING from core fields
        #     NOTE: mana_cost MISSING from core fields
        #     NOTE: oracle_text MISSING from core fields
        #     NOTE: power MISSING from core fields
        #     NOTE: toughness MISSING from core fields
        #     NOTE: type_line MISSING from core fields
        #     "card_faces": [
        #         {
        #             "object": "card_face",
        #             "oracle_id": "61fbaaf2-4286-4e9a-b9cb-aa31262b596a",
        #             "layout": "normal",
        #             "name": "Jinnie Fay, Jetmir's Second",
        #             "mana_cost": "{R/G}{G}{G/W}", NOTE mana_cost defined HERE
        #             "cmc": 3.0, NOTE cmc defined HERE
        #             "type_line": "Legendary Creature — Elf Druid", NOTE type_line defined HERE
        #             "oracle_text": "If you would create one or more tokens, you may instead create that many 2/2 green Cat creature tokens with haste or that many 3/1 green Dog creature tokens with vigilance.", NOTE oracle_text defined HERE
        #             "colors": [ NOTE colors defined HERE
        #                 "G",
        #                 "R",
        #                 "W"
        #             ],
        #             "power": "3", NOTE power defined HERE
        #             "toughness": "3", NOTE toughness defined HERE
        #             "flavor_text": "\"Raffine, Xander, Falco, Ziatora, Jetmir—heel!\"",
        #             "artist": "Jack Hughes",
        #             "artist_id": "ac1a1722-4d2b-499b-b8a9-2d642d3292cc",
        #             "illustration_id": "6b8fb6bb-c0d1-4715-a4df-e4f4695c6130",
        #             "image_uris": {
        #                 "small": "https://cards.scryfall.io/small/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "normal": "https://cards.scryfall.io/normal/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "large": "https://cards.scryfall.io/large/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "png": "https://cards.scryfall.io/png/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.png?1705792310",
        #                 "art_crop": "https://cards.scryfall.io/art_crop/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "border_crop": "https://cards.scryfall.io/border_crop/front/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310"
        #             }
        #         },
        #         {
        #             "object": "card_face",
        #             "oracle_id": "61fbaaf2-4286-4e9a-b9cb-aa31262b596a",
        #             "layout": "normal",
        #             "name": "Jinnie Fay, Jetmir's Second",
        #             "mana_cost": "{R/G}{G}{G/W}",
        #             "cmc": 3.0,
        #             "type_line": "Legendary Creature — Elf Druid",
        #             "oracle_text": "If you would create one or more tokens, you may instead create that many 2/2 green Cat creature tokens with haste or that many 3/1 green Dog creature tokens with vigilance.",
        #             "colors": [
        #                 "G",
        #                 "R",
        #                 "W"
        #             ],
        #             "power": "3",
        #             "toughness": "3",
        #             "flavor_text": "\"Mister Mittens, you would not be-*lieve* the day I had.\"",
        #             "artist": "Jack Hughes",
        #             "artist_id": "ac1a1722-4d2b-499b-b8a9-2d642d3292cc",
        #             "illustration_id": "faebc2ac-9b6e-477d-869e-cee314d26cc0",
        #             "image_uris": {
        #                 "small": "https://cards.scryfall.io/small/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "normal": "https://cards.scryfall.io/normal/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "large": "https://cards.scryfall.io/large/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "png": "https://cards.scryfall.io/png/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.png?1705792310",
        #                 "art_crop": "https://cards.scryfall.io/art_crop/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310",
        #                 "border_crop": "https://cards.scryfall.io/border_crop/back/c/6/c6fb38a7-f453-44e4-b876-6d542d6c2a85.jpg?1705792310"
        #             }
        #         }
        #     ],
        #     "all_parts": [
        #         {
        #             "object": "related_card",
        #             "id": "018830b2-dff9-45f3-9cc2-dc5b2eec0e54",
        #             "component": "combo_piece",
        #             "name": "Jinnie Fay, Jetmir's Second // Jinnie Fay, Jetmir's Second",
        #             "type_line": "Legendary Creature — Elf Druid // Legendary Creature — Elf Druid",
        #             "uri": "https://api.scryfall.com/cards/018830b2-dff9-45f3-9cc2-dc5b2eec0e54"
        #         },
        #         {
        #             "object": "related_card",
        #             "id": "53f30e6b-602d-4e7d-b217-8c8d6b9ecc27",
        #             "component": "token",
        #             "name": "Dog",
        #             "type_line": "Token Creature — Dog",
        #             "uri": "https://api.scryfall.com/cards/53f30e6b-602d-4e7d-b217-8c8d6b9ecc27"
        #         },
        #         {
        #             "object": "related_card",
        #             "id": "687bbd21-ae87-43b9-9d32-e981e7a78d76",
        #             "component": "token",
        #             "name": "Cat",
        #             "type_line": "Token Creature — Cat",
        #             "uri": "https://api.scryfall.com/cards/687bbd21-ae87-43b9-9d32-e981e7a78d76"
        #         }
        #     ],
        #     "legalities": { NOTE PRESENT
        #         "standard": "not_legal",
        #         "future": "not_legal",
        #         "historic": "legal",
        #         "timeless": "legal",
        #         "gladiator": "legal",
        #         "pioneer": "legal",
        #         "explorer": "legal",
        #         "modern": "legal",
        #         "legacy": "legal",
        #         "pauper": "not_legal",
        #         "vintage": "legal",
        #         "penny": "legal",
        #         "commander": "legal",
        #         "oathbreaker": "legal",
        #         "standardbrawl": "not_legal",
        #         "brawl": "legal",
        #         "alchemy": "not_legal",
        #         "paupercommander": "not_legal",
        #         "duel": "legal",
        #         "oldschool": "not_legal",
        #         "premodern": "not_legal",
        #         "predh": "not_legal"
        #     },
        #     "games": [
        #         "paper"
        #     ],
        #     "reserved": false,
        #     "foil": false,
        #     "nonfoil": true,
        #     "finishes": [
        #         "nonfoil"
        #     ],
        #     "oversized": false,
        #     "promo": false,
        #     "reprint": true,
        #     "variation": false,
        #     "set_id": "4d92a8a7-ccb0-437d-abdc-9d70fc5ed672",
        #     "set": "sld",
        #     "set_name": "Secret Lair Drop",
        #     "set_type": "box",
        #     "set_uri": "https://api.scryfall.com/sets/4d92a8a7-ccb0-437d-abdc-9d70fc5ed672",
        #     "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Asld&unique=prints",
        #     "scryfall_set_uri": "https://scryfall.com/sets/sld?utm_source=api",
        #     "rulings_uri": "https://api.scryfall.com/cards/018830b2-dff9-45f3-9cc2-dc5b2eec0e54/rulings",
        #     "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A61fbaaf2-4286-4e9a-b9cb-aa31262b596a&unique=prints",
        #     "collector_number": "1556",
        #     "digital": false,
        #     "rarity": "rare",
        #     "artist": "Jack Hughes",
        #     "artist_ids": [
        #         "ac1a1722-4d2b-499b-b8a9-2d642d3292cc"
        #     ],
        #     "border_color": "borderless",
        #     "frame": "2015",
        #     "frame_effects": [
        #         "legendary",
        #         "inverted"
        #     ],
        #     "security_stamp": "oval",
        #     "full_art": false,
        #     "textless": false,
        #     "booster": false,
        #     "story_spotlight": false,
        #     "promo_types": [
        #         "thick"
        #     ],
        #     "edhrec_rank": 2962,
        #     "penny_rank": 4127,
        #     "prices": {
        #         "usd": "2.01",
        #         "usd_foil": null,
        #         "usd_etched": null,
        #         "eur": null,
        #         "eur_foil": null,
        #         "tix": null
        #     },
        #     "related_uris": {
        #         "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26partner%3Dscryfall%26q%3DJinnie%2BFay%252C%2BJetmir%2527s%2BSecond%2B%252F%252F%2BJinnie%2BFay%252C%2BJetmir%2527s%2BSecond",
        #         "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26partner%3Dscryfall%26q%3DJinnie%2BFay%252C%2BJetmir%2527s%2BSecond%2B%252F%252F%2BJinnie%2BFay%252C%2BJetmir%2527s%2BSecond",
        #         "edhrec": "https://edhrec.com/route/?cc=Jinnie+Fay%2C+Jetmir%27s+Second+%2F%2F+Jinnie+Fay%2C+Jetmir%27s+Second"
        #     },
        #     "purchase_uris": {
        #         "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F533913%3Fpage%3D1",
        #         "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Search?referrer=scryfall&searchString=Jinnie+Fay%2C+Jetmir%27s+Second+%2F%2F+Jinnie+Fay%2C+Jetmir%27s+Second&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
        #         "cardhoarder": "https://www.cardhoarder.com/cards?affiliate_id=scryfall&data%5Bsearch%5D=Jinnie+Fay%2C+Jetmir%27s+Second+%2F%2F+Jinnie+Fay%2C+Jetmir%27s+Second&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
        #     }
        # }
        # if (layout):
        #     if (layout in [CardLayout.SPLIT, CardLayout.FLIP, CardLayout.TRANSFORM, CardLayout.DOUBLE_FACED_TOKEN]):
        # Will have card_layout property describing distinct faces

        scryfall_card, _ = ScryfallCard.objects.update_or_create(
            id=card["id"],
            defaults={
                "layout": card.get("layout"),
                "uri": card.get("uri"),
                "cmc": card.get("cmc"),
                "color_identity": card.get("color_identity", []),
                "colors": card.get("colors", []),
                "defense": card.get("defense"),
                "keywords": card.get("keywords", []),
                "legalities": card.get("legalities", {}),
                "loyalty": card.get("loyalty"),
                "mana_cost": card.get("mana_cost"),
                "name": card["name"],
                "oracle_text": card.get("oracle_text"),
                "power": card.get("power"),
                "toughness": card.get("toughness"),
                "type_line": card.get("type_line"),
                "collector_number": card.get("collector_number"),
                "highres_image": card.get("highres_image"),
                "illustration_id": card.get("illustration_id"),
                "image_status": card.get("image_status"),
                "image_uris": card.get("image_uris", {}),
                "released_at": card.get("released_at"),
                "reprint": card.get("reprint"),
                "variation": card.get("variation"),
                "variation_of": card.get("variation_of"),
            },
        )

        # Process card faces
        card_faces = card.get("card_faces", [])
        if card_faces:
            for face_data in card_faces:
                ScryfallCardFace.objects.update_or_create(
                    parent_card=scryfall_card,
                    defaults={
                        "cmc": face_data.get("cmc"),
                        "colors": face_data.get("colors", []),
                        "defense": face_data.get("defense"),
                        "illustration_id": face_data.get("illustration_id"),
                        "image_uris": face_data.get("image_uris", {}),
                        "layout": face_data.get("layout"),
                        "loyalty": face_data.get("loyalty"),
                        "mana_cost": face_data.get("mana_cost"),
                        "name": face_data.get("name"),
                        "oracle_text": face_data.get("oracle_text"),
                        "power": face_data.get("power"),
                        "toughness": face_data.get("toughness"),
                        "type_line": face_data.get("type_line"),
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

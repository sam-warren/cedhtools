# cedhtools_backend/management/commands/import_decklist_data.py

import logging
import requests
import os
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta
from urllib.parse import urlparse
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from cedhtools_backend.models import (
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldAuthor,
    MoxfieldCard,
    MoxfieldBoard,
    MoxfieldBoardCard
)

# Import tqdm for progress bars
from tqdm import tqdm

# Import timezone utilities
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# Configure standard logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create and configure the StreamHandler
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)

# Remove any existing handlers to prevent duplicate logs
if logger.hasHandlers():
    logger.handlers.clear()

# Add the StreamHandler to the logger
logger.addHandler(handler)


class Command(BaseCommand):
    help = 'Import decklist data from Moxfield API and store it in the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-key',
            type=str,
            help='Moxfield API key for authenticated requests (if required).',
            default=settings.MOXFIELD_USER_AGENT
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Number of decklists to process in each batch.'
        )
        parser.add_argument(
            '--start',
            type=str,
            help='Start date in YYYY-MM-DD format.',
            default='2022-06-01'
        )
        parser.add_argument(
            '--end',
            type=str,
            help='End date in YYYY-MM-DD format.',
            default=None  # Defaults to current date if not provided
        )

    def handle(self, *args, **options):
        api_key = options['api_key']
        batch_size = options['batch_size']
        start_str = options['start']
        end_str = options['end']

        # Parse start and end dates
        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d')
            start_date = timezone.make_aware(start_date, timezone.utc)
            logger.info(f"Import started with start date: {start_date.date()}")
        except ValueError as ve:
            logger.error(
                f"Invalid start date format: {start_str}. Expected YYYY-MM-DD.")
            raise CommandError(
                f"Invalid start date format: {start_str}. Expected YYYY-MM-DD.") from ve

        if end_str:
            try:
                end_date = datetime.strptime(end_str, '%Y-%m-%d')
                end_date = timezone.make_aware(end_date, timezone.utc)
                logger.info(
                    f"Import will run until end date: {end_date.date()}")
            except ValueError as ve:
                logger.error(
                    f"Invalid end date format: {end_str}. Expected YYYY-MM-DD.")
                raise CommandError(
                    f"Invalid end date format: {end_str}. Expected YYYY-MM-DD.") from ve
        else:
            end_date = timezone.now()
            logger.info(
                f"No end date provided. Using current date: {end_date.date()}")

        if start_date > end_date:
            logger.error("Start date must be earlier than end date.")
            raise CommandError("Start date must be earlier than end date.")

        # Calculate total number of decklists to process
        unique_deck_urls = TopdeckPlayerStanding.objects.exclude(decklist__isnull=True).exclude(
            decklist__exact='').values_list('decklist', flat=True).distinct()
        total_decks = unique_deck_urls.count()
        logger.info(f'Total unique decklist URLs to process: {total_decks}')

        # Access the User-Agent and API Base URL from environment variables via settings
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

        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'

        # Initialize tqdm progress bar for decklists
        with tqdm(total=total_decks, desc='Processing decklists', unit='decklist') as pbar:
            try:
                for decklist_url in unique_deck_urls:
                    try:
                        # Log current deck being processed
                        logger.info(
                            f"Processing decklist {pbar.n + 1}/{total_decks}: {decklist_url}")

                        # Check if the deck is already imported
                        if MoxfieldDeck.objects.filter(public_url=decklist_url).exists():
                            logger.info(
                                f'Deck already exists for URL: {decklist_url}')
                            pbar.update(1)
                            continue

                        # Extract deck ID from the decklist URL
                        deck_id = self.get_deck_id(decklist_url)
                        if not deck_id:
                            logger.error(
                                f'Failed to extract deck ID from URL: {decklist_url}')
                            pbar.update(1)
                            continue

                        # Construct the API URL
                        api_url = f"{api_base_url}/decks/all/{deck_id}"

                        # Fetch decklist data from Moxfield API
                        response = requests.get(
                            api_url, headers=headers, timeout=30)
                        response.raise_for_status()
                        deck_data = response.json()
                        # Parse and store deck data within a transaction
                        with transaction.atomic():
                            deck = self.parse_deck(deck_data)

                            # Associate TopdeckPlayerStanding records with this deck
                            TopdeckPlayerStanding.objects.filter(
                                decklist=decklist_url).update(deck=deck)

                            logger.info(
                                f'Successfully imported deck: {deck.name} from URL: {decklist_url}')

                    except requests.exceptions.HTTPError as http_err:
                        if response.status_code == 404:
                            logger.warning(
                                f"Deck not found (404) for URL: {decklist_url}. Skipping.")
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
                        # Update the progress bar regardless of success or failure
                        pbar.update(1)

                    # Respect the rate limit of 1 request per second
                    time.sleep(1)
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
        # 1. Handle Created By User
        created_by_data = deck_data.get('createdByUser')
        if not created_by_data:
            raise ValueError('Deck data missing "createdByUser" field.')

        created_by, created = MoxfieldAuthor.objects.get_or_create(
            username=created_by_data.get('userName', ''),
            defaults={
                'display_name': created_by_data.get('displayName', ''),
                # Using .get() with default
                'profile_image_url': created_by_data.get('profileImageUrl', ''),
                'badges': created_by_data.get('badges', [])
            }
        )

        # 2. Handle Authors
        authors = []
        for author_data in deck_data.get('authors', []):
            author, _ = MoxfieldAuthor.objects.get_or_create(
                username=author_data.get('userName', ''),
                defaults={
                    'display_name': author_data.get('displayName', ''),
                    'profile_image_url': author_data.get('profileImageUrl', ''),
                    'badges': author_data.get('badges', [])
                }
            )
            authors.append(author)

        # 3. Handle Requested Authors
        requested_authors = []
        for author_data in deck_data.get('requestedAuthors', []):
            author, _ = MoxfieldAuthor.objects.get_or_create(
                username=author_data.get('userName', ''),
                defaults={
                    'display_name': author_data.get('displayName', ''),
                    'profile_image_url': author_data.get('profileImageUrl', ''),
                    'badges': author_data.get('badges', [])
                }
            )
            requested_authors.append(author)

        # 4. Handle Main Card
        main_card_data = deck_data.get('main')
        main_card = None
        if main_card_data:
            main_card = self.get_or_create_card(main_card_data)

        # 5. Create Deck
        deck, created = MoxfieldDeck.objects.get_or_create(
            public_url=deck_data.get('publicUrl', ''),
            id=deck_data.get('id', ''),
            defaults={
                'name': deck_data.get('name', 'Unnamed Deck'),
                'description': deck_data.get('description', ''),
                'format': deck_data.get('format', 'Unknown Format'),
                'visibility': deck_data.get('visibility', 'public'),
                'public_id': deck_data.get('publicId', ''),
                'like_count': deck_data.get('likeCount', 0),
                'view_count': deck_data.get('viewCount', 0),
                'comment_count': deck_data.get('commentCount', 0),
                'sfw_comment_count': deck_data.get('sfwCommentCount', 0),
                'are_comments_enabled': deck_data.get('areCommentsEnabled', True),
                'is_shared': deck_data.get('isShared', False),
                'authors_can_edit': deck_data.get('authorsCanEdit', False),
                'created_by_user': created_by,
                'main_card': main_card
            }
        )

        if created:
            # Assign authors and requested authors
            deck.authors.set(authors)
            deck.requested_authors.set(requested_authors)

        # 6. Handle Boards
        boards = deck_data.get('boards', {})
        for board_key, board_data in boards.items():
            board, board_created = MoxfieldBoard.objects.get_or_create(
                deck=deck,
                key=board_key,
                defaults={
                    'count': board_data.get('count', 0)
                }
            )

            # 7. Handle Board Cards
            cards = board_data.get('cards', {})
            board_cards = []
            for card_key, card_data in cards.items():
                card_info = card_data.get('card')
                if not card_info:
                    logger.warning(
                        f'No card info found for card key {card_key} in board {board_key}')
                    continue
                print("CARD INFO", card_info.get('id'))
                card = self.get_or_create_card(card_info)

                board_card = MoxfieldBoardCard(
                    board=board,
                    quantity=card_data.get('quantity', 1),
                    board_type=card_data.get('boardType', ''),
                    finish=card_data.get('finish', ''),
                    is_foil=card_data.get('isFoil', False),
                    is_alter=card_data.get('isAlter', False),
                    is_proxy=card_data.get('isProxy', False),
                    card=card,
                    use_cmc_override=card_data.get('useCmcOverride', False),
                    use_mana_cost_override=card_data.get(
                        'useManaCostOverride', False),
                    use_color_identity_override=card_data.get(
                        'useColorIdentityOverride', False),
                    excluded_from_color=card_data.get(
                        'excludedFromColor', False)
                )

                board_cards.append(board_card)

            # Bulk create BoardCards for efficiency
            if board_cards:
                MoxfieldBoardCard.objects.bulk_create(
                    board_cards, ignore_conflicts=True)

        return deck

    def get_or_create_card(self, card_info):
        """
        Retrieves an existing MoxfieldCard or creates a new one based on the provided card_info.
        """
        card = MoxfieldCard.objects.filter(id=card_info.get('id')).first()
        if card:
            return card, False
        card, created = MoxfieldCard.objects.get_or_create(
            id=card_info.get('id', ''),
            defaults={
                'unique_card_id': card_info.get('uniqueCardId', ''),
                'scryfall_id': card_info.get('scryfall_id', ''),
                'set_code': card_info.get('set', ''),
                'set_name': card_info.get('set_name', ''),
                'name': card_info.get('name', 'Unnamed Card'),
                'cmc': card_info.get('cmc', 0),
                'type': card_info.get('type', ''),
                'type_line': card_info.get('type_line', ''),
                'oracle_text': card_info.get('oracle_text', ''),
                'mana_cost': card_info.get('mana_cost', ''),
                'power': card_info.get('power'),
                'toughness': card_info.get('toughness'),
                'colors': card_info.get('colors', []),
                'color_indicator': card_info.get('color_indicator', []),
                'color_identity': card_info.get('color_identity', []),
                'legalities': card_info.get('legalities', {}),
                'frame': card_info.get('frame', ''),
                'reserved': card_info.get('reserved', False),
                'digital': card_info.get('digital', False),
                'foil': card_info.get('foil', False),
                'nonfoil': card_info.get('nonfoil', False),
                'etched': card_info.get('etched', False),
                'glossy': card_info.get('glossy', False),
                'rarity': card_info.get('rarity', ''),
                'border_color': card_info.get('border_color', ''),
                'colorshifted': card_info.get('colorshifted', False),
                'flavor_text': card_info.get('flavor_text', ''),
                'lang': card_info.get('lang', ''),
                'latest': card_info.get('latest', False),
                'has_multiple_editions': card_info.get('has_multiple_editions', False),
                'has_arena_legal': card_info.get('has_arena_legal', False),
                'prices': card_info.get('prices', {}),
                'artist': card_info.get('artist', ''),
                'promo_types': card_info.get('promo_types', []),
                'card_hoarder_url': card_info.get('cardHoarderUrl', ''),
                'card_kingdom_url': card_info.get('cardKingdomUrl', ''),
                'card_kingdom_foil_url': card_info.get('cardKingdomFoilUrl', ''),
                'card_market_url': card_info.get('cardMarketUrl', ''),
                'tcgplayer_url': card_info.get('tcgPlayerUrl', ''),
                'is_arena_legal': card_info.get('isArenaLegal', False),
                'released_at': self.parse_datetime(card_info.get('released_at')),
                'edhrec_rank': card_info.get('edhrec_rank'),
                'multiverse_ids': card_info.get('multiverse_ids', []),
                'cardmarket_id': card_info.get('cardmarket_id'),
                'mtgo_id': card_info.get('mtgo_id'),
                'tcgplayer_id': card_info.get('tcgplayer_id'),
                'cardkingdom_id': card_info.get('cardkingdom_id'),
                'cardkingdom_foil_id': card_info.get('cardkingdom_foil_id'),
                'reprint': card_info.get('reprint', False),
                'set_type': card_info.get('set_type', ''),
                'cool_stuff_inc_url': card_info.get('coolStuffIncUrl', ''),
                'cool_stuff_inc_foil_url': card_info.get('coolStuffIncFoilUrl', ''),
                'acorn': card_info.get('acorn', ''),
                'image_seq': card_info.get('image_seq'),
                'card_trader_url': card_info.get('cardTraderUrl', ''),
                'card_trader_foil_url': card_info.get('cardTraderFoilUrl', ''),
                'content_warning': card_info.get('content_warning', False),
                'starcitygames_sku': card_info.get('starcitygames_sku', ''),
                'starcitygames_url': card_info.get('starcitygames_url', ''),
                'starcitygames_foil_sku': card_info.get('starcitygames_foil_sku', ''),
                'starcitygames_foil_url': card_info.get('starcitygames_foil_url', ''),
                'is_pauper_commander': card_info.get('isPauperCommander', False),
                'is_token': card_info.get('isToken', False),
                'default_finish': card_info.get('defaultFinish', '')
            }
        )
        if created and not card.id:
            logger.warning(
                f"Card ID missing for card: {card_info.get('name', 'Unnamed Card')}. Skipping.")
        return card

    def parse_datetime(self, datetime_str):
        """
        Parses a datetime string into a Python timezone-aware datetime object.
        Assumes the datetime string is in ISO 8601 format.
        """
        if not datetime_str:
            return None  # or set to a default datetime

        dt = parse_datetime(datetime_str)
        if dt is not None:
            if timezone.is_naive(dt):
                # Assuming the datetime from the API is in UTC. Adjust if necessary.
                dt = timezone.make_aware(dt, timezone.utc)
            else:
                # Convert to the default timezone if necessary
                dt = dt.astimezone(timezone.get_current_timezone())
        return dt

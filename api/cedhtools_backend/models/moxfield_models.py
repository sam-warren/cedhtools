from django.db import models
from django.core.exceptions import ValidationError
import uuid

BOARD_TYPE_CHOICES = [
    ('mainboard', 'mainboard'),
    ('sideboard', 'sideboard'),
    ('maybeboard', 'maybeboard'),
    ('commanders', 'commanders'),
    ('companions', 'companions'),
    ('signature_spells', 'signature_spells'),
    ('attractions', 'attractions'),
    ('stickers', 'stickers'),
    ('contraptions', 'contraptions'),
    ('planes', 'planes'),
    ('schemes', 'schemes'),
    ('tokens', 'tokens'),
]


class MoxfieldAuthor(models.Model):
    username = models.CharField(max_length=511, unique=True)
    display_name = models.CharField(max_length=511, blank=True)
    profile_image_url = models.URLField(null=True, max_length=511, blank=True)
    badges = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'moxfield_author'

    def __str__(self):
        return self.username


class MoxfieldCard(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    unique_card_id = models.CharField(max_length=255, null=True, blank=True)
    scryfall_id = models.UUIDField(null=True, blank=True)
    set_code = models.CharField(max_length=255, null=True, blank=True)
    set_name = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=511)
    cn = models.CharField(max_length=15, null=True, blank=True)
    layout = models.CharField(max_length=255, null=True, blank=True)
    cmc = models.FloatField(default=0.0)
    type = models.CharField(max_length=255, null=True, blank=True)
    type_line = models.CharField(max_length=255, null=True, blank=True)
    oracle_text = models.TextField(null=True, blank=True, max_length=2047)
    mana_cost = models.CharField(max_length=255, null=True, blank=True)
    power = models.CharField(max_length=10, null=True, blank=True)
    toughness = models.CharField(max_length=10, null=True, blank=True)
    colors = models.JSONField(default=list, blank=True)
    color_indicator = models.JSONField(default=list, blank=True)
    color_identity = models.JSONField(default=list, blank=True)
    legalities = models.JSONField(default=dict, blank=True)
    frame = models.CharField(max_length=255, null=True, blank=True)
    reserved = models.BooleanField(default=False)
    digital = models.BooleanField(default=False)
    foil = models.BooleanField(default=False)
    nonfoil = models.BooleanField(default=False)
    etched = models.BooleanField(default=False)
    glossy = models.BooleanField(default=False)
    rarity = models.CharField(max_length=127, null=True, blank=True)
    border_color = models.CharField(max_length=63, null=True, blank=True)
    colorshifted = models.BooleanField(default=False)
    flavor_text = models.TextField(null=True, blank=True)
    lang = models.CharField(max_length=63, null=True, blank=True)
    latest = models.BooleanField(default=False)
    has_multiple_editions = models.BooleanField(default=False)
    has_arena_legal = models.BooleanField(default=False)
    prices = models.JSONField(default=dict, blank=True)
    artist = models.CharField(max_length=255, null=True, blank=True)
    promo_types = models.JSONField(default=list, blank=True)
    card_hoarder_url = models.URLField(null=True, blank=True, max_length=511)
    card_kingdom_url = models.URLField(null=True, blank=True, max_length=511)
    card_kingdom_foil_url = models.URLField(
        null=True, blank=True, max_length=511)
    card_market_url = models.URLField(null=True, blank=True, max_length=511)
    tcgplayer_url = models.URLField(null=True, blank=True, max_length=511)
    is_arena_legal = models.BooleanField(default=False)
    released_at = models.DateTimeField(null=True, blank=True)
    edhrec_rank = models.IntegerField(null=True, blank=True)
    multiverse_ids = models.JSONField(default=list, blank=True)
    cardmarket_id = models.CharField(max_length=511, null=True, blank=True)
    mtgo_id = models.CharField(max_length=511, null=True, blank=True)
    arena_id = models.CharField(max_length=511, null=True, blank=True)
    tcgplayer_id = models.CharField(max_length=511, null=True, blank=True)
    cardkingdom_id = models.CharField(max_length=511, null=True, blank=True)
    cardkingdom_foil_id = models.CharField(
        max_length=511, null=True, blank=True)
    reprint = models.BooleanField(default=False)
    set_type = models.CharField(max_length=511, null=True, blank=True)
    cool_stuff_inc_url = models.URLField(null=True, blank=True, max_length=500)
    cool_stuff_inc_foil_url = models.URLField(
        null=True, blank=True, max_length=511)
    acorn = models.BooleanField(default=False)
    image_seq = models.IntegerField(null=True, blank=True)
    card_trader_url = models.URLField(null=True, blank=True, max_length=511)
    card_trader_foil_url = models.URLField(
        null=True, blank=True, max_length=511)
    content_warning = models.BooleanField(default=False)
    starcitygames_sku = models.CharField(max_length=255, null=True, blank=True)
    starcitygames_url = models.URLField(null=True, blank=True, max_length=511)
    starcitygames_foil_sku = models.CharField(
        max_length=255, null=True, blank=True)
    starcitygames_foil_url = models.URLField(
        null=True, blank=True, max_length=511)
    is_pauper_commander = models.BooleanField(default=False)
    is_token = models.BooleanField(default=False)
    default_finish = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'moxfield_card'
        indexes = [
            models.Index(fields=['unique_card_id']),
            models.Index(fields=['scryfall_id']),
            models.Index(fields=['id']),
            models.Index(fields=['name']),
            models.Index(fields=['color_identity']),
            models.Index(fields=['cmc']),
            models.Index(fields=['oracle_text']),
            models.Index(fields=['mana_cost']),
            models.Index(fields=['colors']),
            models.Index(fields=['type_line']),
            models.Index(fields=['legalities']),
        ]


class MoxfieldCardFace(models.Model):
    card = models.ForeignKey(
        MoxfieldCard,
        related_name='card_faces',
        on_delete=models.CASCADE
    )
    face_id = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=511)
    mana_cost = models.CharField(max_length=255, null=True, blank=True)
    type_line = models.CharField(max_length=255, null=True, blank=True)
    oracle_text = models.TextField(null=True, blank=True, max_length=2047)
    colors = models.JSONField(default=list, blank=True)
    color_indicator = models.JSONField(default=list, blank=True)
    flavor_text = models.TextField(null=True, blank=True)
    image_seq = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'moxfield_card_face'

    def __str__(self):
        return f"{self.name} - {self.card.name}"


class MoxfieldDeck(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    format = models.CharField(max_length=100)
    visibility = models.CharField(max_length=50)
    public_url = models.URLField(max_length=500)
    public_id = models.CharField(max_length=255)
    like_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    sfw_comment_count = models.IntegerField(default=0)
    are_comments_enabled = models.BooleanField(default=True)
    is_shared = models.BooleanField(default=False)
    authors_can_edit = models.BooleanField(default=False)
    created_by_user = models.ForeignKey(
        MoxfieldAuthor,
        related_name='created_decks',
        on_delete=models.CASCADE
    )
    authors = models.ManyToManyField(
        MoxfieldAuthor,
        related_name='decks',
        blank=True
    )
    requested_authors = models.ManyToManyField(
        MoxfieldAuthor,
        related_name='requested_decks',
        blank=True
    )
    main_card = models.ForeignKey(
        MoxfieldCard,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='main_decks'
    )

    version = models.IntegerField(default=1)
    tokens = models.ManyToManyField(
        'MoxfieldCard',
        related_name='decks_as_tokens',
        blank=True,
        limit_choices_to={'is_token': True}
    )
    tokens_to_cards = models.JSONField(default=dict, blank=True)
    cards_to_tokens = models.JSONField(default=dict, blank=True)
    token_mappings = models.JSONField(default=dict, blank=True)
    hubs = models.ManyToManyField(
        'MoxfieldHub', related_name='decks', blank=True)
    created_at_utc = models.DateTimeField(null=True, blank=True)
    last_updated_at_utc = models.DateTimeField(null=True, blank=True)
    export_id = models.UUIDField(null=True, unique=True)
    author_tags = models.JSONField(default=dict, blank=True)
    is_too_beaucoup = models.BooleanField(default=False)
    affiliates = models.JSONField(default=dict, blank=True)
    main_card_id_is_back_face = models.BooleanField(default=False)
    allow_primer_clone = models.BooleanField(default=False)
    enable_multiple_printings = models.BooleanField(default=False)
    include_basic_lands_in_price = models.BooleanField(default=False)
    include_commanders_in_price = models.BooleanField(default=False)
    include_signature_spells_in_price = models.BooleanField(default=False)
    colors = models.JSONField(default=list, blank=True)
    color_percentages = models.JSONField(default=dict, blank=True)
    color_identity = models.JSONField(default=list, blank=True)
    color_identity_percentages = models.JSONField(default=dict, blank=True)
    owner_user_id = models.CharField(max_length=255, null=True, blank=True)
    deck_tier = models.IntegerField(default=0)
    commander_tier = models.IntegerField(default=0)
    deck_tier1_count = models.IntegerField(default=0)
    deck_tier2_count = models.IntegerField(default=0)
    deck_tier3_count = models.IntegerField(default=0)
    deck_tier4_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'moxfield_deck'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['public_id']),
            models.Index(fields=['color_identity']),
        ]

    def __str__(self):
        return f"Deck {self.id}"


class MoxfieldHub(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'moxfield_hub'

    def __str__(self):
        return self.name


class MoxfieldBoard(models.Model):
    deck = models.ForeignKey(
        MoxfieldDeck,
        related_name='boards',
        on_delete=models.CASCADE
    )
    key = models.CharField(max_length=255, choices=BOARD_TYPE_CHOICES)
    count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.key.capitalize()} Board for {self.deck.name}"

    class Meta:
        db_table = 'moxfield_board'
        indexes = [
            models.Index(fields=['deck']),
            models.Index(fields=['key']),
        ]


class MoxfieldBoardCard(models.Model):
    board = models.ForeignKey(
        MoxfieldBoard,
        related_name='board_cards',
        on_delete=models.CASCADE
    )
    quantity = models.IntegerField(default=1)
    board_type = models.CharField(max_length=127, choices=BOARD_TYPE_CHOICES)
    finish = models.CharField(max_length=127)
    is_foil = models.BooleanField(default=False)
    is_alter = models.BooleanField(default=False)
    is_proxy = models.BooleanField(default=False)
    card = models.ForeignKey(
        MoxfieldCard,
        related_name='board_cards',
        on_delete=models.CASCADE
    )
    use_cmc_override = models.BooleanField(default=False)
    use_mana_cost_override = models.BooleanField(default=False)
    use_color_identity_override = models.BooleanField(default=False)
    excluded_from_color = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.quantity}x {self.card.name} on {self.board.key.capitalize()} Board"

    class Meta:
        db_table = 'moxfield_board_card'
        indexes = [
            models.Index(fields=['board']),
            models.Index(fields=['card']),
            models.Index(fields=['board_type']),
        ]

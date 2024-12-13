from django.db import models
from django.core.exceptions import ValidationError


class MoxfieldAuthor(models.Model):
    username = models.CharField(max_length=511, unique=True)
    display_name = models.CharField(max_length=511, blank=True)
    profile_image_url = models.URLField(null=True, max_length=511, blank=True)
    badges = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.username


class MoxfieldCard(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    unique_card_id = models.CharField(
        max_length=255, null=True, blank=True)
    scryfall_id = models.CharField(max_length=255, null=True, blank=True)
    set_code = models.CharField(max_length=255, null=True, blank=True)
    set_name = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=511)
    cmc = models.FloatField(default=0.0)
    type = models.CharField(max_length=255, null=True, blank=True)
    type_line = models.CharField(max_length=255, null=True, blank=True)
    oracle_text = models.TextField(
        null=True, blank=True, max_length=2047)
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
    released_at = models.DateTimeField(
        null=True, blank=True)  # Allow null and blank
    edhrec_rank = models.IntegerField(null=True, blank=True)
    multiverse_ids = models.JSONField(default=list, blank=True)
    cardmarket_id = models.CharField(max_length=511, null=True, blank=True)
    mtgo_id = models.CharField(max_length=511, null=True, blank=True)
    tcgplayer_id = models.CharField(max_length=511, null=True, blank=True)
    cardkingdom_id = models.CharField(max_length=511, null=True, blank=True)
    cardkingdom_foil_id = models.CharField(
        max_length=511, null=True, blank=True)
    reprint = models.BooleanField(default=False)
    set_type = models.CharField(max_length=511, null=True, blank=True)
    cool_stuff_inc_url = models.URLField(null=True, blank=True, max_length=500)
    cool_stuff_inc_foil_url = models.URLField(
        null=True, blank=True, max_length=511)
    acorn = models.CharField(max_length=255, null=True, blank=True)
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
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['scryfall_id']),
            models.Index(fields=['set_code']),
        ]


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

    def __str__(self):
        return self.name


class MoxfieldBoard(models.Model):
    deck = models.ForeignKey(
        MoxfieldDeck,
        related_name='boards',
        on_delete=models.CASCADE
    )
    key = models.CharField(max_length=255)  # e.g., 'main', 'side'
    count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.key.capitalize()} Board for {self.deck.name}"


class MoxfieldBoardCard(models.Model):
    board = models.ForeignKey(
        MoxfieldBoard,
        related_name='board_cards',
        on_delete=models.CASCADE
    )
    quantity = models.IntegerField(default=1)
    board_type = models.CharField(max_length=127)
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

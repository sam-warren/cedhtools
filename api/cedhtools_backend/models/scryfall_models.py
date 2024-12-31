from django.db import models
from django.contrib.postgres.fields import ArrayField

LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('de', 'German'),
    ('it', 'Italian'),
    ('pt', 'Portuguese'),
    ('ja', 'Japanese'),
    ('ko', 'Korean'),
    ('ru', 'Russian'),
    ('zhs', 'Chinese (Simplified)'),
    ('zht', 'Chinese (Traditional)'),
    ('he', 'Hebrew'),
    ('la', 'Latin'),
    ('grc', 'Ancient Greek'),
    ('ar', 'Arabic'),
    ('sa', 'Sanskrit'),
    ('ph', 'Phyrexian'),
]

LAYOUT_CHOICES = [
    ('normal', 'Normal'),
    ('split', 'Split'),
    ('flip', 'Flip'),
    ('transform', 'Transform'),
    ('modal_dfc', 'Modal Double-Faced Card'),
    ('meld', 'Meld'),
    ('leveler', 'Leveler'),
    ('class', 'Class'),
    ('case', 'Case'),
    ('saga', 'Saga'),
    ('adventure', 'Adventure'),
    ('mutate', 'Mutate'),
    ('planar', 'Planar'),
    ('scheme', 'Scheme'),
    ('vanguard', 'Vanguard'),
    ('token', 'Token'),
    ('double_faced_token', 'Double-Faced Token'),
    ('emblem', 'Emblem'),
    ('augment', 'Augment'),
    ('host', 'Host'),
    ('art_series', 'Art Series'),
    ('reversible_card', 'Reversible Card'),
]

BORDER_COLOR_CHOICES = [
    ('black', 'Black'),
    ('borderless', 'Borderless'),
    ('gold', 'Gold'),
    ('silver', 'Silver'),
    ('white', 'White'),
]

FRAME_CHOICES = [
    ('1993', '1993'),
    ('1997', '1997'),
    ('2003', '2003'),
    ('2015', '2015'),
    ('future', 'Future'),
]

IMAGE_STATUS_CHOICES = [
    ('missing', 'Missing'),
    ('placeholder', 'Placeholder'),
    ('lowres', 'Low Resolution'),
    ('highres_scan', 'High Resolution Scan'),
]

RARITY_CHOICES = [
    ('common', 'Common'),
    ('uncommon', 'Uncommon'),
    ('rare', 'Rare'),
    ('special', 'Special'),
    ('mythic', 'Mythic'),
    ('bonus', 'Bonus'),
]

SECURITY_STAMP_CHOICES = [
    ('oval', 'Oval'),
    ('triangle', 'Triangle'),
    ('acorn', 'Acorn'),
    ('circle', 'Circle'),
    ('arena', 'Arena'),
    ('heart', 'Heart'),
]

COMPONENT_CHOICES = [
    ('token', 'Token'),
    ('meld_part', 'Meld Part'),
    ('meld_result', 'Meld Result'),
    ('combo_piece', 'Combo Piece'),
]


class ScryfallCard(models.Model):
    # Core Fields
    # arena_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s Arena ID, if any. A large percentage of cards are not available on Arena and do not have this ID.')
    id = models.UUIDField(primary_key=True, editable=False,
                          help_text='A unique ID for this card in Scryfall’s database.')
    # lang = models.CharField(
    #     max_length=3, help_text='A language code for this printing.', choices=language_choices)
    # mtgo_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s Magic Online ID (also known as the Catalog ID), if any. A large percentage of cards are not available on Magic Online and do not have this ID.')
    # mtgo_foil_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s foil Magic Online ID (also known as the Catalog ID), if any. A large percentage of cards are not available on Magic Online and do not have this ID.')
    # multiverse_ids = ArrayField(
    #     models.IntegerField(), null=True, blank=True, help_text='This card’s multiverse IDs on Gatherer, if any, as an array of integers. Note that Scryfall includes many promo cards, tokens, and other esoteric objects that do not have these identifiers.')
    # tcgplayer_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s ID on TCGplayer’s API, also known as the productId.')
    # tcgplayer_etched_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s ID on TCGplayer’s API, for its etched version if that version is a separate product.')
    # cardmarket_id = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s ID on Cardmarket’s API, also known as the idProduct.')
    # object = models.CharField(
    #     max_length=25, help_text='A content type for this object, always card.')
    layout = models.CharField(
        max_length=25, choices=LAYOUT_CHOICES, help_text='A code for this card’s layout.')
    # oracle_id = models.UUIDField(null=True, blank=True, help_text='A unique ID for this card’s oracle identity. This value is consistent across reprinted card editions, and unique among different cards with the same name (tokens, Unstable variants, etc). Always present except for the reversible_card layout where it will be absent; oracle_id will be found on each face instead.')
    # prints_search_uri = models.URLField(
    #     null=True, blank=True, help_text='A link to where you can begin paginating all re/prints for this card on Scryfall’s API.')
    # rulings_uri = models.URLField(
    #     help_text='A link to this card’s rulings list on Scryfall’s API.')
    # scryfall_uri = models.URLField(
    #     help_text='A link to this card’s permapage on Scryfall’s website.')
    # uri = models.URLField(
    #     help_text='A link to this card object on Scryfall’s API.')

    # --- Gameplay Fields ---

    # all_parts - foreign key? from RelatedCard
    # card_faces - foregin key? from CardFace
    cmc = models.FloatField(
        help_text='The card’s mana value. Note that some funny cards have fractional mana costs.')
    color_identity = ArrayField(models.CharField(),
                                help_text='This card’s color identity.')
    color_indicator = ArrayField(
        models.CharField(max_length=25), null=True, blank=True, help_text='The colors in this card’s color indicator, if any. A null value for this field indicates the card does not have one.')
    colors = ArrayField(
        models.CharField(max_length=25), null=True, blank=True, help_text='This card’s colors, if the overall card has colors defined by the rules. Otherwise the colors will be on the card_faces objects, see below.')
    defense = models.CharField(
        max_length=25, null=True, blank=True, help_text='This face’s defense, if any.')
    # edhrec_rank = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s overall rank/popularity on EDHREC. Not all cards are ranked.')
    # hand_modifier = models.CharField(max_length=25,
    #                                  null=True, blank=True, help_text='This card’s hand modifier, if it is Vanguard card. This value will contain a delta, such as -1.')
    keywords = ArrayField(
        models.CharField(max_length=25), help_text='An array of keywords that this card uses, such as \'Flying\' and \'Cumulative upkeep\'.'
    )
    legalities = models.JSONField(
        help_text='An object describing the legality of this card across play formats. Possible legalities are legal, not_legal, restricted, and banned.')
    # life_modifier = models.CharField(null=True, blank=True, help_text='This card’s life modifier, if it is Vanguard card. This value will contain a delta, such as +2.'
    #                                  )
    loyalty = models.CharField(
        null=True, blank=True, help_text='This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.')
    mana_cost = models.CharField(
        null=True, blank=True, help_text='The mana cost for this card. This value will be any empty string "" if the cost is absent. Remember that per the game rules, a missing mana cost and a mana cost of {0} are different values. Multi-faced cards will report this value in card faces.')
    name = models.CharField(
        help_text='The name of this card. If this card has multiple faces, this field will contain both names separated by //.')
    oracle_text = models.TextField(
        null=True, blank=True, help_text='The Oracle text for this card, if any.')
    # penny_rank = models.IntegerField(
    #     null=True, blank=True, help_text='This card’s rank/popularity on Penny Dreadful. Not all cards are ranked.')
    power = models.CharField(max_length=25, null=True, blank=True,
                             help_text='This card’s power, if any. Note that some cards have powers that are not numeric, such as *.')
    # produced_mana = ArrayField(models.CharField(
    #     max_length=25), null=True, blank=True, help_text='Colors of mana that this card could produce.')
    # reserved = models.BooleanField(
    #     help_text='True if this card is on the Reserved List.')
    toughness = models.CharField(max_length=25, null=True, blank=True,
                                 help_text='This card’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.')
    type_line = models.CharField(
        help_text='The type line of this card.')

    # --- Print Fields ---
    # artist = models.CharField(
    #     null=True, blank=True, help_text='The name of the illustrator of this card. Newly spoiled cards may not have this field yet.')
    # artist_ids = ArrayField(models.UUIDField(), null=True, blank=True,
    #                                help_text='The IDs of the artists that illustrated this card. Newly spoiled cards may not have this field yet.')
    # attraction_lights = ArrayField(models.CharField(
    #     max_length=25), null=True, blank=True, help_text='The lit Unfinity attractions lights on this card, if any.')
    # booster = models.BooleanField(
    #     help_text='Whether this card is found in boosters.')
    # border_color = models.CharField(max_length=10, choices=border_color_choices,
    #                                 help_text='This card’s border color: black, white, borderless, silver, or gold.')
    card_back_id = models.UUIDField(
        help_text='The Scryfall ID for the card back design present on this card.')
    collector_number = models.CharField(
        max_length=10, help_text='This card’s collector number. Note that collector numbers can contain non-numeric characters, such as letters or ★.')
    # content_warning = models.BooleanField(
    #     null=True, blank=True, help_text='True if you should consider avoiding use of this print downstream.')
    # digital = models.BooleanField(
    #     help_text='True if this card was only released in a video game.')
    # finishes = ArrayField(models.CharField(
    # ), help_text='An array of computer-readable flags that indicate if this card can come in foil, nonfoil, or etched finishes.')
    # flavor_name = models.CharField(
    #     null=True, blank=True, help_text='The just-for-fun name printed on the card (such as for Godzilla series cards).')
    # flavor_text = models.CharField(
    #     max_length=2000, null=True, blank=True, help_text='The flavor text, if any.')
    # frame_effects = ArrayField(
    #     models.CharField(), null=True, blank=True, help_text='This card’s frame effects, if any.')
    # frame = models.CharField(choices=frame_choices,
    #                          help_text='This card’s frame layout.')
    # full_art = models.BooleanField(
    #     help_text='True if this card’s artwork is larger than normal.')
    # games = ArrayField(models.CharField(
    #     max_length=25), help_text='A list of games that this card print is available in, paper, arena, and/or mtgo.')
    highres_image = models.BooleanField(
        help_text='True if this card’s imagery is high resolution.')
    illustration_id = models.UUIDField(
        null=True, blank=True, help_text='A unique identifier for the card artwork that remains consistent across reprints. Newly spoiled cards may not have this field yet.')
    image_status = models.CharField(max_length=25, choices=IMAGE_STATUS_CHOICES,
                                    help_text='A computer-readable indicator for the state of this card’s image, one of missing, placeholder, lowres, or highres_scan.')
    image_uris = models.JSONField(
        null=True, blank=True, help_text='An object listing available imagery for this card. See the Card Imagery article for more information.')
    # oversized = models.BooleanField(
    #     help_text='True if this card is oversized.')
    # prices = models.JSONField(
    #     help_text='An object containing daily price information for this card, including usd, usd_foil, usd_etched, eur, eur_foil, eur_etched, and tix prices, as strings.')
    # printed_name = models.CharField(
    #     null=True, blank=True, help_text='The localized name printed on this card, if any.')
    # printed_text = models.CharField(max_length=2000, null=True, blank=True,
    #                                 help_text='The localized text printed on this card, if any.')
    # printed_type_line = models.CharField(
    #     null=True, blank=True, help_text='The localized type line printed on this card, if any.')
    # promo = models.BooleanField(
    #     help_text='True if this card is a promotional print.')
    # promo_types = ArrayField(models.CharField(), null=True, blank=True,
    #                                 help_text='An array of strings describing what categories of promo cards this card falls into.')
    # purchase_uris = models.JSONField(
    #     null=True, blank=True, help_text='An object providing URIs to this card’s listing on major marketplaces. Omitted if the card is unpurchaseable.')
    # rarity = models.CharField(max_length=25, choices=rarity_choices,
    #                           help_text='This card’s rarity. One of common, uncommon, rare, or mythic.')
    # related_uris = models.JSONField(
    #     help_text='An object providing URIs to this card’s listing on other Magic: The Gathering online resources.')
    released_at = models.DateField(
        help_text='The date this card was first released.')
    reprint = models.BooleanField(help_text='True if this card is a reprint.')
    # scryfall_set_uri = models.URLField(
    #     help_text='A link to this card’s set on Scryfall’s website.')
    # set_name = models.CharField(help_text='This card’s full set name.')
    # set_search_uri = models.URLField(
    #     help_text='A link to where you can begin paginating this card’s set on the Scryfall API.')
    # set_type = models.CharField(
    #     help_text='The type of set this printing is in.')
    # set_uri = models.URLField(
    #     help_text='A link to this card’s set object on Scryfall’s API.')
    # set = models.CharField(help_text='This card’s set code.')
    # set_id = models.UUIDField(help_text='This card’s Set object UUID.')
    # story_spotlight = models.BooleanField(
    #     help_text='True if this card is a Story Spotlight.')
    # textless = models.BooleanField(
    #     help_text='True if the card is printed without text.')
    variation = models.BooleanField(
        help_text='Whether this card is a variation of another printing.')
    variation_of = models.UUIDField(
        null=True, blank=True, help_text='The printing ID of the printing this card is a variation of.')
    # security_stamp = models.CharField(max_length=25, null=True, blank=True, choices=security_stamp_choices,
    #                                   help_text='The security stamp on this card, if any. One of oval, triangle, acorn, circle, arena, or heart.')
    # watermark = models.CharField(
    #     null=True, blank=True, help_text='The watermark on this card, if any.')

    class Meta:
        db_table = 'scryfall_card'
        indexes = [
            models.Index(fields=['id']),
        ]

    def __str__(self):
        return self.name


class ScryfallCardFace(models.Model):
    parent_card = models.ForeignKey(
        ScryfallCard,
        related_name='card_faces',
        on_delete=models.CASCADE,
        help_text='The card object this face appears on.'
    )
    # artist = models.CharField(
    #     null=True, blank=True, help_text='The name of the illustrator of this card face. Newly spoiled cards may not have this field yet.')
    # artist_id = models.UUIDField(
    #     null=True, blank=True, help_text='The ID of the illustrator of this card face. Newly spoiled cards may not have this field yet.')
    cmc = models.FloatField(
        help_text='The mana value of this particular face, if the card is reversible.')
    color_indicator = ArrayField(models.CharField(
        max_length=25), null=True, blank=True, help_text='The colors in this face’s color indicator, if any.')
    colors = ArrayField(models.CharField(max_length=25), null=True, blank=True,
                        help_text='This face’s colors, if the game defines colors for the individual face of this card.')
    defense = models.CharField(max_length=25, null=True, blank=True,
                               help_text='This face’s defense, if the game defines colors for the individual face of this card.')
    flavor_text = models.TextField(
        null=True, blank=True, help_text='The flavor text printed on this face, if any.')
    illustration_id = models.UUIDField(null=True, blank=True,
                                       help_text='A unique identifier for the card face artwork that remains consistent across reprints. Newly spoiled cards may not have this field yet.')
    image_uris = models.JSONField(
        null=True, blank=True, help_text='An object providing URIs to imagery for this face, if this is a double-sided card. If this card is not double-sided, then the image_uris property will be part of the parent object instead.')
    layout = models.CharField(max_length=25, null=True, blank=True, choices=LAYOUT_CHOICES,
                              help_text='The layout of this card face, if the card is reversible.')
    loyalty = models.CharField(
        max_length=25, null=True, help_text='This face’s loyalty, if any.')
    mana_cost = models.CharField(
        help_text='The mana cost for this face. This value will be any empty string "" if the cost is absent. Remember that per the game rules, a missing mana cost and a mana cost of {0} are different values.')
    name = models.CharField(help_text='The name of this particular face.')
    # object = models.CharField(
    #     help_text='A content type for this object, always card_face.')
    # oracle_id = models.UUIDField(
    #     null=True, blank=True, help_text='The Oracle ID of this particular face, if the card is reversible.')
    oracle_text = models.CharField(
        max_length=2000, null=True, blank=True, help_text='The Oracle text for this face, if any.')
    power = models.CharField(max_length=25, null=True, blank=True,
                             help_text='This face’s power, if any. Note that some cards have powers that are not numeric, such as *.')
    # printed_name = models.CharField(max_length=255, null=True, blank=True,
    #                                 help_text='The localized name printed on this face, if any.')
    # printed_text = models.CharField(max_length=2000, null=True, blank=True,
    #                                 help_text='The localized text printed on this face, if any.')
    # printed_type_line = models.CharField(
    #     help_text='The localized type line printed on this face, if any.')
    toughness = models.CharField(
        null=True, blank=True, help_text='This face’s toughness, if any.')
    type_line = models.CharField(
        null=True, blank=True, help_text='The type line of this particular face, if the card is reversible.')
    # watermark = models.CharField(
    #     null=True, blank=True, help_text='The watermark on this particulary card face, if any.')

    class Meta:
        db_table = 'scryfall_card_face'

    def __str__(self):
        return self.name


# class ScryfallRelatedCard(models.Model):
#     id = models.UUIDField(
#         primary_key=True, help_text='A unique ID for this card in Scryfall’s database.')
#     object = models.CharField(
#         max_length=25, help_text='A content type for this object, always related_card.')
#     component = models.CharField(max_length=25, choices=component_choices,
#                                  help_text='A field explaining what role this card plays in this relationship, one of token, meld_part, meld_result, or combo_piece.')
#     name = models.CharField(
#         help_text='The name of this particular related card.')
#     type_line = models.CharField(help_text='The type line of this card.')
#     uri = models.URLField(
#         help_text='A URI where you can retrieve a full object describing this card on Scryfall’s API.')

#     class Meta:
#         db_table = 'scryfall_related_card'

#     def __str__(self):
#         return self.name

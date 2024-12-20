from django.db import models


class ScryfallCard(models.Model):
    # Basic card identifiers
    scryfall_id = models.UUIDField(primary_key=True)  # Unique card ID
    # Oracle ID (links different versions of a card)
    oracle_id = models.UUIDField(null=True)
    name = models.CharField(max_length=511)
    lang = models.CharField(max_length=10)  # Language code (e.g., "en")
    released_at = models.DateField()  # Release date of the card
    set_name = models.CharField(max_length=255)  # Full set name
    collector_number = models.CharField(
        max_length=50)  # Set-specific card number
    rarity = models.CharField(max_length=50)  # Rarity of the card

    # URLs
    uri = models.URLField(max_length=511)  # API URI for the card
    scryfall_uri = models.URLField(max_length=511)  # Web page URL for the card
    # JSON object for card images
    image_uris = models.JSONField(default=dict, blank=True)

    # Card details
    mana_cost = models.CharField(max_length=50, blank=True)  # Mana cost
    cmc = models.FloatField()  # Converted mana cost
    # Card type (e.g., "Creature — Elf Warrior")
    type_line = models.CharField(max_length=255)
    # Rules text
    oracle_text = models.TextField(blank=True, null=True, max_length=2047)
    power = models.CharField(max_length=10, blank=True,
                             null=True)  # Power (e.g., "3")
    toughness = models.CharField(
        max_length=10, blank=True, null=True)  # Toughness (e.g., "2")
    # Array of colors (e.g., ["W", "U"])
    colors = models.JSONField(default=list, blank=True)
    # Array of color identity (e.g., ["W", "U"])
    color_identity = models.JSONField(default=list, blank=True)

    # Legality and pricing
    # JSON object for format legality
    legalities = models.JSONField(default=dict, blank=True)
    # JSON object for card prices
    prices = models.JSONField(default=dict, blank=True)

    # Flags and metadata
    # Whether the card is digital-only
    digital = models.BooleanField(default=False)
    # Whether the card is a reprint
    reprint = models.BooleanField(default=False)
    # Whether the card has full art
    full_art = models.BooleanField(default=False)
    # Whether the card is textless
    textless = models.BooleanField(default=False)

    # Relationships
    set_id = models.UUIDField()  # ID of the card set

    class Meta:
        db_table = "scryfall_card"
        indexes = [
            models.Index(fields=["scryfall_id"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.set_name} #{self.collector_number})"

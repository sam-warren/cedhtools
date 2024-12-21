from django.db import models


class ScryfallCard(models.Model):
    scryfall_id = models.UUIDField(primary_key=True)
    oracle_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255)
    lang = models.CharField(max_length=5, null=True, blank=True)
    released_at = models.DateField(null=True, blank=True)
    set_id = models.UUIDField(null=True, blank=True)
    set_name = models.CharField(max_length=255, null=True, blank=True)
    collector_number = models.CharField(max_length=50, null=True, blank=True)
    rarity = models.CharField(max_length=50, null=True, blank=True)
    layout = models.CharField(max_length=50, null=True, blank=True)
    uri = models.TextField(null=True, blank=True)
    scryfall_uri = models.TextField(null=True, blank=True)
    cmc = models.FloatField(default=0.0)
    colors = models.JSONField(default=list, blank=True)
    color_identity = models.JSONField(default=list, blank=True)
    legalities = models.JSONField(default=dict, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    prices = models.JSONField(default=dict, blank=True)
    digital = models.BooleanField(default=False)
    reprint = models.BooleanField(default=False)
    full_art = models.BooleanField(default=False)
    textless = models.BooleanField(default=False)
    story_spotlight = models.BooleanField(default=False)

    class Meta:
        db_table = "scryfall_card"
        indexes = [
            models.Index(fields=["scryfall_id"]),
            models.Index(fields=["oracle_id"]),
        ]


class ScryfallCardFace(models.Model):
    card = models.ForeignKey(
        ScryfallCard, on_delete=models.CASCADE, related_name="faces")
    name = models.CharField(max_length=255)
    mana_cost = models.CharField(max_length=50, null=True, blank=True)
    type_line = models.CharField(max_length=255, null=True, blank=True)
    oracle_text = models.TextField(null=True, blank=True)
    power = models.CharField(max_length=50, null=True, blank=True)
    toughness = models.CharField(max_length=50, null=True, blank=True)
    loyalty = models.CharField(max_length=10, null=True, blank=True)
    colors = models.JSONField(default=list, blank=True)
    image_uris = models.JSONField(default=dict, blank=True, null=True)

    class Meta:
        db_table = "scryfall_card_face"

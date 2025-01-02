from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex


class ScryfallCard(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    scryfall_uri = models.URLField()
    layout = models.CharField(max_length=50)
    type_line = models.CharField(max_length=255)
    mana_cost = models.CharField(max_length=50, null=True, blank=True)
    cmc = models.FloatField()
    legalities = models.JSONField(null=True, blank=True)
    image_uris = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'scryfall_card'
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name

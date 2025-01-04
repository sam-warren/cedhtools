from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex


class ScryfallCard(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    scryfall_uri = models.URLField(max_length=500)
    layout = models.CharField(max_length=50)
    type_line = models.CharField(max_length=255)
    mana_cost = models.CharField(max_length=50, null=True, blank=True)
    cmc = models.FloatField()
    legality = models.CharField(max_length=50)
    image_uris = models.JSONField(max_length=500, null=True, blank=True)
    released_at = models.DateField(null=True, db_index=True)
    collector_number = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'scryfall_card'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['released_at', 'collector_number']),
        ]

    def __str__(self):
        return self.name

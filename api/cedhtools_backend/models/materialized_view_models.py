from django.db import models


class CEDHToolsMetrics(models.Model):
    total_decks = models.IntegerField()
    total_tournaments = models.IntegerField()
    total_unique_cards = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'cedhtools_metrics'

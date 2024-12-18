from django.contrib.postgres.fields import ArrayField
from django.db import models


class CommanderCardStats(models.Model):
    commander_ids = ArrayField(models.CharField(
        max_length=255))
    commander_names = models.JSONField()
    card_id = models.CharField(max_length=255)
    unique_card_id = models.CharField(max_length=255)
    card_name = models.CharField(max_length=255)
    total_decks = models.IntegerField()
    avg_win_rate = models.FloatField()
    avg_draw_rate = models.FloatField()
    tournament_size = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()

    class Meta:
        managed = False  # Do not allow Django to manage the database view
        db_table = 'commander_card_stats_mv'

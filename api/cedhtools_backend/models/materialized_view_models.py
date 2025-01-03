from django.db import models
from django.contrib.postgres.fields import ArrayField


class CEDHToolsMetrics(models.Model):
    total_decks = models.IntegerField()
    total_tournaments = models.IntegerField()
    total_unique_cards = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'cedhtools_metrics'


class CommanderDeckRelationships(models.Model):
    deck_id = models.CharField(max_length=255, primary_key=True)
    commander_list = ArrayField(models.CharField(max_length=255))

    class Meta:
        managed = False
        db_table = 'commander_deck_relationships'


class CardStatisticsByCommander(models.Model):
    commander_list = ArrayField(models.CharField(max_length=255))
    card_id = models.CharField(max_length=255)
    unique_card_id = models.CharField(max_length=255)
    deck_count = models.IntegerField()
    avg_win_rate = models.FloatField()
    avg_draw_rate = models.FloatField()
    avg_loss_rate = models.FloatField()

    class Meta:
        managed = False
        db_table = 'card_statistics_by_commander'

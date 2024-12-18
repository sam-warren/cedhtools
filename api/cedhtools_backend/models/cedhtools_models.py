from django.contrib.postgres.fields import ArrayField
from django.db import models


class CommanderCardStats(models.Model):
    deck_id = models.CharField(max_length=255)
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


class DeckCards(models.Model):
    deck_id = models.CharField(max_length=255)
    unique_card_id = models.CharField(max_length=255)
    card_name = models.CharField(max_length=255)

    class Meta:
        managed = False  # Do not allow Django to manage the database view
        db_table = 'deck_cards_mv'


class PlayerStanding(models.Model):
    playerstanding_id = models.CharField(max_length=255)
    wins = models.IntegerField()
    draws = models.IntegerField()
    losses = models.IntegerField()
    deck_id = models.CharField(max_length=255)
    tournament_id = models.CharField(max_length=255)
    commander_ids = ArrayField(models.CharField(
        max_length=255))
    commander_names = models.JSONField()
    tournament_size = models.IntegerField()
    top_cut = models.IntegerField()
    start_date = models.BigIntegerField()
    win_rate = models.FloatField()
    draw_rate = models.FloatField()

    class Meta:
        managed = False
        db_table = 'player_standings_mv'

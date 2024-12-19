from django.contrib.postgres.fields import ArrayField
from django.db import models


class CommanderCardStats(models.Model):
    deck_id = models.CharField(max_length=255)
    tournament_id = models.CharField(max_length=255)
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
        db_table = 'mv_commander_card_stats'


class DeckCards(models.Model):
    deck_id = models.CharField(max_length=255)
    unique_card_id = models.CharField(max_length=255)
    card_name = models.CharField(max_length=255)

    class Meta:
        managed = False  # Do not allow Django to manage the database view
        db_table = 'mv_deck_cards'


class PlayerStandings(models.Model):
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
        db_table = 'mv_player_standings'


class CommanderStatsWeekly(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_ids = ArrayField(models.CharField(
        max_length=255))
    commander_names = models.JSONField()  # JSON field for array of commander names
    week = models.DateField()  # Weekly date
    total_decks = models.IntegerField()  # Total decks
    avg_win_rate = models.FloatField()  # Average win rate
    avg_draw_rate = models.FloatField()  # Average draw rate

    class Meta:
        db_table = "mv_commander_stats_weekly"  # Table name in the database
        managed = False  # Django will not manage the database schema


class CardStatsWeekly(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_ids = ArrayField(models.CharField(
        max_length=255))
    commander_names = models.JSONField()  # JSON field for array of commander names
    unique_card_id = models.CharField(max_length=255)  # Unique card identifier
    card_name = models.CharField(max_length=255)  # Card name
    week = models.DateField()  # Weekly date
    total_decks = models.IntegerField()  # Total decks
    avg_win_rate = models.FloatField()  # Average win rate
    avg_draw_rate = models.FloatField()  # Average draw rate

    class Meta:
        db_table = "mv_card_stats_weekly"  # Table name in the database
        managed = False  # Django will not manage the database schema

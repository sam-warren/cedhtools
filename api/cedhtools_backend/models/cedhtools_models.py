from django.contrib.postgres.fields import ArrayField
from django.db import models


class CommanderCardStats(models.Model):
    deck_id = models.CharField(max_length=255)
    tournament_id = models.CharField(max_length=255)
    commander_ids = ArrayField(models.CharField(max_length=255))
    commander_names = models.JSONField()
    unique_card_id = models.CharField(max_length=255)
    card_face_name = models.CharField(max_length=255)  # Replaces card_name
    card_face_mana_cost = models.CharField(
        max_length=50, null=True, blank=True)
    card_face_oracle_text = models.TextField(null=True, blank=True)
    card_face_colors = ArrayField(models.CharField(
        max_length=50), default=list, blank=True)
    card_face_type_line = models.CharField(
        max_length=255, null=True, blank=True)
    win_rate = models.FloatField()
    draw_rate = models.FloatField()
    tournament_size = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()
    card_face_image_uris = models.JSONField()  # Face-specific images

    class Meta:
        managed = False
        db_table = "mv_commander_card_stats"


class DeckCards(models.Model):
    deck_id = models.CharField(max_length=255)
    unique_card_id = models.CharField(max_length=255)
    card_face_name = models.CharField(max_length=255)  # Replaces card_name
    card_face_mana_cost = models.CharField(
        max_length=50, null=True, blank=True)
    card_face_type_line = models.CharField(
        max_length=255, null=True, blank=True)
    card_face_oracle_text = models.TextField(null=True, blank=True)
    card_face_colors = ArrayField(models.CharField(
        max_length=50), default=list, blank=True)
    card_color_identity = models.JSONField()
    deck_color_identity = models.JSONField()

    class Meta:
        managed = False
        db_table = "mv_deck_cards"


class TournamentSummary(models.Model):
    tournament_id = models.CharField(max_length=255)
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()
    tournament_size = models.IntegerField()

    class Meta:
        managed = False
        db_table = "mv_tournament_summary"


class PlayerStandings(models.Model):
    playerstanding_id = models.CharField(max_length=255)
    wins = models.IntegerField()
    draws = models.IntegerField()
    losses = models.IntegerField()
    deck_id = models.CharField(max_length=255)
    tournament_id = models.CharField(max_length=255)
    commander_ids = ArrayField(models.CharField(max_length=255))
    commander_names = models.JSONField()
    tournament_size = models.IntegerField()
    top_cut = models.IntegerField()
    start_date = models.BigIntegerField()
    win_rate = models.FloatField()
    draw_rate = models.FloatField()

    class Meta:
        managed = False
        db_table = "mv_player_standings"


class CommanderStatsWeekly(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_ids = ArrayField(models.CharField(max_length=255))
    commander_names = models.JSONField()
    week = models.DateField()
    total_decks = models.IntegerField()
    avg_win_rate = models.FloatField()
    avg_draw_rate = models.FloatField()

    class Meta:
        db_table = "mv_commander_stats_weekly"
        managed = False


class CardStatsWeekly(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_ids = ArrayField(models.CharField(max_length=255))
    commander_names = models.JSONField()
    unique_card_id = models.CharField(max_length=255)
    card_face_id = models.UUIDField()  # Added card_face_id
    card_face_name = models.CharField(max_length=255)  # Added card_face_name
    week = models.DateField()
    total_decks = models.IntegerField()
    avg_win_rate = models.FloatField()
    avg_draw_rate = models.FloatField()

    class Meta:
        db_table = "mv_card_stats_weekly"
        managed = False

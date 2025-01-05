from django.db import models
from django.contrib.postgres.fields import ArrayField


class CEDHToolsMetrics(models.Model):
    total_decks = models.IntegerField()
    total_tournaments = models.IntegerField()
    total_unique_cards = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'cedhtools_metrics'

    @classmethod
    def refresh(cls):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                'REFRESH MATERIALIZED VIEW cedhtools_metrics;')


class CommanderMetaStatistics(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_list = ArrayField(models.CharField(max_length=255))
    total_decks = models.IntegerField()
    avg_win_rate = models.FloatField()
    avg_draw_rate = models.FloatField()
    avg_loss_rate = models.FloatField()
    win_rate_stddev = models.FloatField()

    class Meta:
        managed = False
        db_table = 'commander_meta_statistics'
        indexes = [
            models.Index(fields=['id']),
        ]

    @classmethod
    def refresh(cls):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                'REFRESH MATERIALIZED VIEW commander_meta_statistics;')


class CommanderDeckRelationships(models.Model):
    deck_id = models.CharField(max_length=255, primary_key=True)
    commander_list = ArrayField(models.CharField(max_length=255))

    class Meta:
        managed = False
        db_table = 'commander_deck_relationships'

    @classmethod
    def refresh(cls):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                'REFRESH MATERIALIZED VIEW commander_deck_relationships;')


class CardStatisticsByCommander(models.Model):
    id = models.IntegerField(primary_key=True)
    commander_list = ArrayField(models.CharField(max_length=255))
    unique_card_id = models.CharField(max_length=255)
    deck_count = models.IntegerField()
    avg_win_rate = models.FloatField()
    win_rate_stddev = models.FloatField()
    avg_draw_rate = models.FloatField()
    avg_loss_rate = models.FloatField()
    total_wins = models.IntegerField()
    total_draws = models.IntegerField()
    total_losses = models.IntegerField()
    most_common_printing = models.UUIDField()

    class Meta:
        managed = False
        db_table = 'card_statistics_by_commander'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['unique_card_id']),
        ]

    @classmethod
    def refresh(cls):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                'REFRESH MATERIALIZED VIEW card_statistics_by_commander;')


class CardPrintings(models.Model):
    unique_card_id = models.CharField(max_length=255, primary_key=True)
    most_common_printing = models.UUIDField()
    usage_count = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'card_printings'

    @classmethod
    def refresh(cls):
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW card_printings;')

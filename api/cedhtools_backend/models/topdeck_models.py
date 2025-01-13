from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from typing import Union, Optional


class QuerySetMixin:
    @classmethod
    def get_related_fields(cls):
        return []

    @classmethod
    def get_prefetch_fields(cls):
        return []

    @classmethod
    def with_related(cls):
        qs = cls.objects.all()
        select_related = cls.get_related_fields()
        prefetch_related = cls.get_prefetch_fields()

        if select_related:
            qs = qs.select_related(*select_related)
        if prefetch_related:
            qs = qs.prefetch_related(*prefetch_related)
        return qs


class TopdeckTournament(models.Model, QuerySetMixin):
    tid = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=2047, null=True, blank=True)
    swiss_num = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()
    tournament_size = models.IntegerField(validators=[MinValueValidator(3)])
    average_elo = models.IntegerField(null=True, blank=True)
    mode_elo = models.IntegerField(null=True, blank=True)
    median_elo = models.IntegerField(null=True, blank=True)
    top_elo = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'topdeck_tournament'
        indexes = [
            models.Index(fields=['tid']),
            models.Index(fields=['start_date']),
            models.Index(fields=['tournament_size']),
            models.Index(fields=['tournament_size', 'start_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.tid})"


class TopdeckPlayer(models.Model, QuerySetMixin):
    id = models.AutoField(primary_key=True)
    topdeck_id = models.CharField(
        max_length=255, null=True, blank=True, unique=True)
    name = models.CharField(max_length=2047)
    first_seen_date = models.BigIntegerField(null=True)
    last_seen_date = models.BigIntegerField(null=True)

    class Meta:
        db_table = 'topdeck_player'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['last_seen_date', 'topdeck_id'])
        ]

    def __str__(self):
        return self.name

    def get_tournament_history(self, limit=None):
        qs = self.standings.select_related('tournament')\
            .order_by('-tournament__start_date')
        return qs[:limit] if limit else qs


class TopdeckPlayerStanding(models.Model, QuerySetMixin):
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='standings', on_delete=models.CASCADE
    )
    player_topdeck_id = models.CharField(
        max_length=255, null=True, blank=True)
    player = models.ForeignKey(
        'TopdeckPlayer',
        related_name='standings',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    decklist = models.URLField(
        null=True,
        blank=True,
        max_length=1023,
    )
    deck = models.ForeignKey(
        'MoxfieldDeck',
        related_name='standings',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    standing_position = models.IntegerField()
    wins = models.IntegerField(default=0)
    wins_swiss = models.IntegerField(default=0)
    wins_bracket = models.IntegerField(default=0)
    byes = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    losses_swiss = models.IntegerField(default=0)
    losses_bracket = models.IntegerField(default=0)
    total_matches = models.IntegerField(default=0)
    computed_win_rate = models.FloatField(default=0.0)
    computed_loss_rate = models.FloatField(default=0.0)
    computed_draw_rate = models.FloatField(default=0.0)

    class Meta:
        db_table = 'topdeck_player_standing'
        indexes = [
            models.Index(fields=['tournament', 'player']),
            models.Index(fields=['tournament', 'standing_position']),
        ]
        unique_together = [['tournament', 'player'],
                           ['tournament', 'standing_position']]
        ordering = ['standing_position']

    def __str__(self):
        return f"{self.player.name if self.player else 'Anonymous'} in {self.tournament.name}"


class TopdeckMatch(models.Model, QuerySetMixin):
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='matches', on_delete=models.CASCADE
    )
    round = models.CharField(max_length=255)
    table_number = models.IntegerField()
    status = models.CharField(max_length=255)
    winner_topdeck_id = models.CharField(
        max_length=255, null=True, blank=True)
    winner = models.ForeignKey(
        'TopdeckPlayer',
        related_name='matches_won',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    is_draw = models.BooleanField(default=False)
    is_top_cut = models.BooleanField(default=False)
    pod_size = models.IntegerField(
        validators=[MinValueValidator(3), MaxValueValidator(4)])

    class Meta:
        db_table = 'topdeck_match'
        indexes = [
            models.Index(fields=['tournament', 'round', 'table_number']),
            models.Index(fields=['tournament', 'winner']),
            models.Index(fields=['tournament', 'is_top_cut']),
        ]
        unique_together = [['tournament', 'round', 'table_number']]

    def __str__(self):
        return f"Match {self.table_number} in Round {self.round} of {self.tournament.name}"


class TopdeckMatchPlayer(models.Model, QuerySetMixin):
    match = models.ForeignKey(
        'TopdeckMatch', on_delete=models.CASCADE, related_name='players')
    player_topdeck_id = models.CharField(
        max_length=255, null=True, blank=True)
    player = models.ForeignKey(
        'TopdeckPlayer',
        related_name='matches',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    seat_position = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)])

    class Meta:
        db_table = 'topdeck_match_player'
        indexes = [
            models.Index(fields=['match', 'player']),
            models.Index(fields=['player']),
        ]
        unique_together = [
            ['match', 'seat_position'],
            ['match', 'player']
        ]

    def __str__(self):
        return f"{self.player.name if self.player else 'Anonymous'} at seat {self.seat_position} in {self.match}"

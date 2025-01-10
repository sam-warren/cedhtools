from django.db import models
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


class TopdeckTournament(models. Model, QuerySetMixin):
    tid = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=511, null=True, blank=True)
    swiss_num = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()
    tournament_size = models.IntegerField(validators=[MinValueValidator(3)])
    average_elo = models.FloatField(null=True, blank=True)
    mode_elo = models.FloatField(null=True, blank=True)
    median_elo = models.FloatField(null=True, blank=True)
    top_elo = models.FloatField(null=True, blank=True)

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

    @classmethod
    def get_related_fields(cls):
        return []


class TopdeckPlayer(models.Model, QuerySetMixin):
    topdeck_id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=511)
    first_seen_date = models.BigIntegerField()
    last_seen_date = models.BigIntegerField()

    class Meta:
        db_table = 'topdeck_player'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['last_seen_date', 'topdeck_id'])
        ]

    def __str__(self):
        return self.name

    @classmethod
    def get_related_fields(cls):
        return []

    def get_tournament_history(self, limit=None):
        qs = self.standings.select_related('tournament')\
            .order_by('-tournament__start_date')
        return qs[:limit] if limit else qs


class TopdeckPlayerStanding(models.Model, QuerySetMixin):
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='standings', on_delete=models.CASCADE
    )
    player = models.ForeignKey(
        'TopdeckPlayer',
        related_name='standings',
        on_delete=models.CASCADE
    )
    decklist = models.URLField(
        null=True,
        blank=True,
        max_length=255,
    )
    deck = models.ForeignKey(
        'MoxfieldDeck', related_name='player_standings', null=True, blank=True, on_delete=models.SET_NULL
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

    def __str__(self):
        return f"{self.decklist}: {self.wins}-{self.draws}-{self.losses}"

    class Meta:
        db_table = 'topdeck_player_standing'
        indexes = [
            models.Index(fields=['tournament', 'player']),
            models.Index(fields=['player', 'deck']),
            models.Index(fields=['tournament', 'player', 'standing_position']),
            models.Index(fields=['tournament', 'player', 'deck']),
            models.Index(fields=['player', 'standing_position']),
        ]
        unique_together = [['tournament', 'player'],
                           ['tournament', 'standing_position']]
        ordering = ['standing_position']

    @property
    def total_matches(self):
        return self.wins + self.draws + self.losses

    @property
    def computed_win_rate(self):
        total = self.total_matches
        return self.wins / total if total > 0 else 0.0

    @property
    def computed_loss_rate(self):
        total = self.total_matches
        return self.losses / total if total > 0 else 0.0

    @property
    def computed_draw_rate(self):
        total = self.total_matches
        return self.draws / total if total > 0 else 0.0

    @classmethod
    def get_related_fields(cls):
        return ['tournament', 'player']

    def __str__(self):
        return f"{self.player.name} in {self.tournament.name}"


class TopdeckMatch(models.Model, QuerySetMixin):
    # TODO: Add choices for round and status
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='matches', on_delete=models.CASCADE
    )
    round = models.CharField(max_length=255)  # should use choices
    table_number = models.IntegerField()
    status = models.CharField(max_length=255)  # should use choices
    winner = models.ForeignKey(
        'TopdeckPlayer',
        related_name='matches_won',
        null=True,
        blank=True,
        on_delete=models.CASCADE
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
            models.Index(fields=['tournament', 'is_draw']),
            models.Index(fields=['tournament', 'is_top_cut']),
            models.Index(fields=['tournament', 'pod_size']),
            models.Index(fields=['tournament', 'status']),
        ]
        unique_together = [['tournament', 'round', 'table_number']]

    @classmethod
    def get_related_fields(cls):
        return ['tournament', 'winner']

    def __str__(self):
        return f"Match {self.table_number} in Round {self.round} of {self.tournament.name}"

    @property
    def winner_display(self) -> str:
        """Returns 'Draw' or the winner's name"""
        return 'Draw' if self.is_draw else (self.winner.name if self.winner else None)

    def set_winner(self, winner_id: Optional[str]) -> None:
        """Sets the winner, handling draws appropriately"""
        if winner_id == 'Draw':
            self.winner = None
            self.is_draw = True
        else:
            self.winner = TopdeckPlayer.objects.get(topdeck_id=winner_id)
            self.is_draw = False


class TopdeckMatchPlayer(models.Model, QuerySetMixin):
    match = models.ForeignKey(
        'TopdeckMatch', on_delete=models.CASCADE, related_name='players')
    player = models.ForeignKey(
        'TopdeckPlayer', on_delete=models.CASCADE, related_name='match_appearances')
    standing = models.ForeignKey(
        TopdeckPlayerStanding, on_delete=models.CASCADE, related_name='match_appearances')
    seat_position = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)])

    class Meta:
        db_table = 'topdeck_match_player'
        indexes = [
            models.Index(fields=['match', 'player']),
            models.Index(fields=['player']),
            models.Index(fields=['standing'])
        ]
        unique_together = [
            ['match', 'seat_position'],
            ['match', 'player']
        ]

    @classmethod
    def get_related_fields(cls):
        return ['match', 'player', 'standing']

    def __str__(self):
        return f"{self.player.name} at seat {self.seat_position} in {self.match}"

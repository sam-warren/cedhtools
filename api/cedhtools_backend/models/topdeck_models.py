from django.db import models
from ..validators.moxfield_url_validator import validate_moxfield_url


class TopdeckTournament(models. Model):
    tid = models.CharField(max_length=255, unique=True)
    swiss_num = models.IntegerField()
    start_date = models.BigIntegerField()
    top_cut = models.IntegerField()

    def __str__(self):
        return self.tid

    class Meta:
        db_table = 'topdeck_tournament'
        indexes = [
            models.Index(fields=['tid']),
            models.Index(fields=['start_date']),
            models.Index(fields=['top_cut'])
        ]


class TopdeckPlayerStanding(models.Model):
    tournament = models.ForeignKey(
        'TopdeckTournament', related_name='standings', on_delete=models.CASCADE
    )
    decklist = models.URLField(
        null=True,
        blank=True,
        max_length=255,
        validators=[validate_moxfield_url]
    )
    deck = models.ForeignKey(
        'MoxfieldDeck', related_name='player_standings', null=True, blank=True, on_delete=models.SET_NULL
    )
    wins = models.IntegerField()
    draws = models.IntegerField()
    losses = models.IntegerField()
    win_rate = models.FloatField()
    draw_rate = models.FloatField()
    loss_rate = models.FloatField()

    def __str__(self):
        return f"{self.decklist}: {self.wins}-{self.draws}-{self.losses}"

    class Meta:
        db_table = 'topdeck_player_standing'
        indexes = [
            models.Index(fields=['deck']),
            models.Index(fields=['decklist']),
            models.Index(fields=['tournament']),
        ]

    def clean(self):
        if self.decklist:
            validate_moxfield_url(self.decklist)

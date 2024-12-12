from django.db import models
from .validators.moxfield_url_validator import validate_moxfield_url
class Tournament(models.Model):
    tid = models.CharField(max_length=100, unique=True)
    tournament_name = models.CharField(max_length=255)
    swiss_num = models.IntegerField()
    start_date = models.BigIntegerField()
    game = models.CharField(max_length=100)
    format = models.CharField(max_length=100)
    top_cut = models.IntegerField()

    def __str__(self):
        return self.tournament_name

class PlayerStanding(models.Model):
    tournament = models.ForeignKey(
        'Tournament', related_name='standings', on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    decklist = models.URLField(
        null=True,
        blank=True,
        max_length=255,
        validators=[validate_moxfield_url]
    )
    wins = models.IntegerField(default=0)
    wins_swiss = models.IntegerField(default=0)
    wins_bracket = models.IntegerField(default=0)
    win_rate = models.FloatField(null=True, blank=True)
    win_rate_swiss = models.FloatField(null=True, blank=True)
    win_rate_bracket = models.FloatField(null=True, blank=True)
    draws = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    losses_swiss = models.IntegerField(default=0)
    losses_bracket = models.IntegerField(default=0)
    player_id = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.tournament.tournament_name}"

    def clean(self):
        if self.decklist:
            validate_moxfield_url(self.decklist)
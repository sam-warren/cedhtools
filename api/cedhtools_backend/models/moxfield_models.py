from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex


class MoxfieldCard(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    unique_card_id = models.CharField(max_length=255, null=True, blank=True)
    scryfall_card = models.ForeignKey(
        'ScryfallCard',
        on_delete=models.SET_NULL,
        null=True,
        db_column='scryfall_id',
        related_name='moxfield_cards'
    )
    decks = models.ManyToManyField(
        'MoxfieldDeck', through='MoxfieldDeckCard', related_name='cards')

    class Meta:
        db_table = 'moxfield_card'
        indexes = [
            models.Index(fields=['unique_card_id']),
            models.Index(fields=['id']),
        ]


class MoxfieldDeckCard(models.Model):
    deck = models.ForeignKey('MoxfieldDeck', on_delete=models.CASCADE)
    card = models.ForeignKey('MoxfieldCard', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    board = models.CharField(max_length=50)

    class Meta:
        db_table = 'moxfield_deck_card'
        indexes = [
            models.Index(fields=['deck', 'card']),
            models.Index(fields=['board']),
        ]


class MoxfieldDeck(models.Model):
    id = models.CharField(primary_key=True)
    public_id = models.CharField(max_length=255)
    name = models.CharField(max_length=1023)
    colors = ArrayField(models.CharField(max_length=10), default=list)
    color_identity = ArrayField(models.CharField(max_length=10), default=list)

    class Meta:
        db_table = 'moxfield_deck'
        indexes = [
            models.Index(fields=['public_id']),
            GinIndex(fields=['color_identity']),
            GinIndex(fields=['colors']),
        ]

    def __str__(self):
        return f"Deck {self.id}"

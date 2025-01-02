from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField


class MoxfieldCard(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    unique_card_id = models.CharField(max_length=255, null=True, blank=True)
    scryfall_id = models.UUIDField()
    decks = models.ManyToManyField(
        'MoxfieldDeck', through='MoxfieldDeckCard', related_name='cards')

    class Meta:
        db_table = 'moxfield_card'
        indexes = [
            models.Index(fields=['unique_card_id']),
            models.Index(fields=['scryfall_id']),
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
        ]


class MoxfieldDeck(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    public_id = models.CharField(max_length=255)

    class Meta:
        db_table = 'moxfield_deck'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['public_id']),
        ]

    def __str__(self):
        return f"Deck {self.id}"

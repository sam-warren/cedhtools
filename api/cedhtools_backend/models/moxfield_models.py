from django.db import models
from django.core.exceptions import ValidationError
import uuid
from .scryfall_models import ScryfallCard

BOARD_TYPE_CHOICES = [
    ('mainboard', 'mainboard'),
    ('commanders', 'commanders'),
    ('companions', 'companions'),
]


class MoxfieldCard(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    unique_card_id = models.CharField(max_length=255, null=True, blank=True)
    scryfall_id = models.ForeignKey(
        ScryfallCard,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name='moxfield_cards'
    )

    def __str__(self):
        return self.scryfall_id

    class Meta:
        db_table = 'moxfield_card'
        indexes = [
            models.Index(fields=['unique_card_id']),
            models.Index(fields=['scryfall_id']),
            models.Index(fields=['id']),
        ]


class MoxfieldDeck(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    format = models.CharField(max_length=100)
    public_url = models.URLField(max_length=500)
    public_id = models.CharField(max_length=255)
    main_card = models.ForeignKey(
        MoxfieldCard,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='main_decks'
    )
    colors = models.JSONField(default=list, blank=True)
    color_percentages = models.JSONField(default=dict, blank=True)
    color_identity = models.JSONField(default=list, blank=True)
    color_identity_percentages = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'moxfield_deck'
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['public_id']),
        ]

    def __str__(self):
        return f"Deck {self.id}"


class MoxfieldBoard(models.Model):
    deck = models.ForeignKey(
        MoxfieldDeck,
        related_name='boards',
        on_delete=models.CASCADE
    )
    key = models.CharField(max_length=255, choices=BOARD_TYPE_CHOICES)

    def __str__(self):
        return f"{self.key.capitalize()} Board for {self.deck.name}"

    class Meta:
        db_table = 'moxfield_board'
        indexes = [
            models.Index(fields=['deck']),
            models.Index(fields=['key']),
        ]


class MoxfieldBoardCard(models.Model):
    board = models.ForeignKey(
        MoxfieldBoard,
        related_name='board_cards',
        on_delete=models.CASCADE
    )
    card = models.ForeignKey(
        MoxfieldCard,
        related_name='board_cards',
        on_delete=models.CASCADE
    )

    def __str__(self):
        return f"{self.card.name} on {self.board.key.capitalize()} Board"

    class Meta:
        db_table = 'moxfield_board_card'
        indexes = [
            models.Index(fields=['board']),
            models.Index(fields=['card']),
        ]

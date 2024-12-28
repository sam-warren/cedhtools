from rest_framework import serializers
from .models import (
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldBoard,
    MoxfieldBoardCard,
    MoxfieldCard,
    TopdeckTournament,
)
import logging

# Configure logger
logger = logging.getLogger('cedhtools_backend')


class MoxfieldCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoxfieldCard
        fields = [
            'id',
            'name',
            'type',
            'mana_cost',
            'power',
            'toughness',
            'oracle_text'
        ]


class MoxfieldBoardCardSerializer(serializers.ModelSerializer):
    card = MoxfieldCardSerializer()

    class Meta:
        model = MoxfieldBoardCard
        fields = [
            'quantity',
            'card',
            'finish',
            'is_foil',
            'is_proxy'
        ]


class MoxfieldBoardSerializer(serializers.ModelSerializer):
    board_cards = MoxfieldBoardCardSerializer(many=True)

    class Meta:
        model = MoxfieldBoard
        fields = [
            'key',
            'board_cards'
        ]


class MoxfieldDeckSerializer(serializers.ModelSerializer):
    boards = MoxfieldBoardSerializer(many=True)

    class Meta:
        model = MoxfieldDeck
        fields = [
            'id',
            'name',
            'description',
            'format',
            'visibility',
            'public_url',
            'boards'
        ]


class TopdeckPlayerStandingSerializer(serializers.ModelSerializer):
    deck = MoxfieldDeckSerializer()

    class Meta:
        model = TopdeckPlayerStanding
        fields = [
            'name',
            'wins',
            'losses',
            'draws',
            'win_rate',
            'deck'
        ]


class TopdeckTournamentSerializer(serializers.ModelSerializer):
    standings = TopdeckPlayerStandingSerializer(many=True)

    class Meta:
        model = TopdeckTournament
        fields = [
            'tid',
            'tournament_name',
            'start_date',
            'game',
            'format',
            'standings'
        ]

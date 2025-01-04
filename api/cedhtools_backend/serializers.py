from rest_framework import serializers
from .models import (
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldCard,
    TopdeckTournament,
)
import logging

# Configure logger
logger = logging.getLogger('cedhtools_backend')


class MoxfieldCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoxfieldCard
        fields = "__all__"


class MoxfieldDeckSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoxfieldDeck
        fields = "__all__"


class TopdeckPlayerStandingSerializer(serializers.ModelSerializer):
    deck = MoxfieldDeckSerializer()

    class Meta:
        model = TopdeckPlayerStanding
        fields = "__all__"


class TopdeckTournamentSerializer(serializers.ModelSerializer):
    standings = TopdeckPlayerStandingSerializer(many=True)

    class Meta:
        model = TopdeckTournament
        fields = "__all__"

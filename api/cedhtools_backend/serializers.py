from rest_framework import serializers
from .models import (
    TopdeckPlayerStanding,
    MoxfieldDeck,
    MoxfieldCard,
    TopdeckTournament,
)
import logging
from dataclasses import asdict

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


class CardPerformanceSerializer(serializers.Serializer):
    deck_win_rate = serializers.FloatField()
    card_win_rate = serializers.FloatField()
    chi_squared = serializers.FloatField()
    p_value = serializers.FloatField()

    def to_representation(self, instance):
        # If instance is a DTO, convert it to dict
        if hasattr(instance, '__dataclass_fields__'):
            instance = asdict(instance)
        return super().to_representation(instance)


class CardStatisticsSerializer(serializers.Serializer):
    unique_card_id = serializers.CharField()
    scryfall_id = serializers.CharField()
    name = serializers.CharField()
    type_line = serializers.CharField()
    cmc = serializers.FloatField()
    image_uris = serializers.JSONField()
    legality = serializers.CharField()
    mana_cost = serializers.CharField()
    scryfall_uri = serializers.CharField()
    decks_with_card = serializers.IntegerField()
    performance = CardPerformanceSerializer()

    def to_representation(self, instance):
        # If instance is a DTO, convert it to dict
        if hasattr(instance, '__dataclass_fields__'):
            instance = asdict(instance)
        return super().to_representation(instance)


class MetaStatisticsSerializer(serializers.Serializer):
    sample_size = serializers.DictField()  # Changed from total_decks to match DTO
    baseline_performance = serializers.DictField()

    def to_representation(self, instance):
        # If instance is a DTO, convert it to dict
        if hasattr(instance, '__dataclass_fields__'):
            instance = asdict(instance)
        return super().to_representation(instance)


class CommanderDetailSerializer(serializers.Serializer):
    unique_card_id = serializers.CharField()
    scryfall_id = serializers.CharField()
    name = serializers.CharField()
    type_line = serializers.CharField()
    cmc = serializers.FloatField()
    image_uris = serializers.JSONField()
    legality = serializers.CharField()
    mana_cost = serializers.CharField()
    scryfall_uri = serializers.CharField()


class CardStatisticsResponseSerializer(serializers.Serializer):
    main = serializers.DictField(
        child=serializers.ListField(child=CardStatisticsSerializer())
    )
    other = serializers.ListField(child=CardStatisticsSerializer())

    def to_representation(self, instance):
        # If instance is a dict with DTO values, convert them
        if isinstance(instance, dict):
            main_cards = instance.get('main', {})
            other_cards = instance.get('other', [])

            # Convert DTOs in main cards
            converted_main = {
                type_code: [
                    asdict(card) if hasattr(
                        card, '__dataclass_fields__') else card
                    for card in cards
                ]
                for type_code, cards in main_cards.items()
            }

            # Convert DTOs in other cards
            converted_other = [
                asdict(card) if hasattr(card, '__dataclass_fields__') else card
                for card in other_cards
            ]

            instance = {
                'main': converted_main,
                'other': converted_other
            }

        return super().to_representation(instance)


class CommanderStatisticsResponseSerializer(serializers.Serializer):
    meta_statistics = MetaStatisticsSerializer()
    card_statistics = CardStatisticsResponseSerializer()
    commanders = CommanderDetailSerializer(many=True)

    def to_representation(self, instance):
        # If meta_statistics is a DTO, convert it to dict
        if hasattr(instance.get('meta_statistics'), '__dataclass_fields__'):
            instance['meta_statistics'] = asdict(instance['meta_statistics'])

        # Card statistics conversion is handled by CardStatisticsResponseSerializer

        return super().to_representation(instance)

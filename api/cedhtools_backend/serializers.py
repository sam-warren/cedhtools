from rest_framework import serializers
from .models import TopdeckPlayerStanding, MoxfieldDeck, MoxfieldBoard, MoxfieldBoardCard, MoxfieldCard, TopdeckTournament


class MoxfieldCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoxfieldCard
        fields = ['id', 'name', 'type', 'mana_cost',
                  'power', 'toughness', 'oracle_text']


class MoxfieldBoardCardSerializer(serializers.ModelSerializer):
    card = MoxfieldCardSerializer()

    class Meta:
        model = MoxfieldBoardCard
        fields = ['quantity', 'card', 'finish', 'is_foil', 'is_proxy']


class MoxfieldBoardSerializer(serializers.ModelSerializer):
    board_cards = MoxfieldBoardCardSerializer(many=True)

    class Meta:
        model = MoxfieldBoard
        fields = ['key', 'board_cards']


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
        fields = ['tid', 'tournament_name',
                  'start_date', 'game', 'format', 'standings']


class ChiSquaredTestSerializer(serializers.Serializer):
    chi2_statistic = serializers.FloatField(allow_null=True)
    p_value = serializers.FloatField(allow_null=True)
    degrees_of_freedom = serializers.IntegerField(allow_null=True)
    expected_freq = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField()), allow_null=True
    )


class CardStatisticsSerializer(serializers.Serializer):
    unique_card_id = serializers.CharField()
    card_name = serializers.CharField()
    number_of_entries = serializers.IntegerField()
    average_card_win_rate = serializers.FloatField()
    average_card_draw_rate = serializers.FloatField()
    average_card_loss_rate = serializers.FloatField()  # New field
    chi_squared_test = ChiSquaredTestSerializer()  # Added field


class CommanderStatisticsSerializer(serializers.Serializer):
    commander_pair_id = serializers.CharField()
    commander_pair_name = serializers.CharField()
    total_entries = serializers.IntegerField()
    total_wins = serializers.IntegerField()
    total_draws = serializers.IntegerField()
    total_losses = serializers.IntegerField()  # Added field
    overall_win_rate = serializers.FloatField()
    overall_draw_rate = serializers.FloatField()
    overall_loss_rate = serializers.FloatField()  # New field
    popularity_over_time = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    commander_winrate_over_time = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
    cards = CardStatisticsSerializer(many=True)
    chi_squared_test = ChiSquaredTestSerializer()  # Added field


class CommanderStatisticsResponseSerializer(serializers.Serializer):
    commanders = CommanderStatisticsSerializer(many=True)

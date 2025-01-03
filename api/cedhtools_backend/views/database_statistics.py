from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.db import models
from ..models import TopdeckPlayerStanding, MoxfieldDeckCard, MoxfieldDeck


class DatabaseStatisticsView(APIView):
    """
    View to retrieve general statistics about the database contents.
    Returns counts of tournaments, entries, unique commanders, and unique cards.
    Optimized to minimize database queries.
    """

    def get(self, request):
        try:
            tournament_stats = TopdeckPlayerStanding.objects.aggregate(
                tournament_count=Count('tournament_id', distinct=True),
                entry_count=Count('id')
            )

            card_stats = MoxfieldDeckCard.objects.aggregate(
                card_count=Count('card_id', distinct=True),
            )

            deck_count = MoxfieldDeck.objects.count()

            return Response({
                'tournaments': tournament_stats['tournament_count'],
                'tournament_entries': tournament_stats['entry_count'],
                'cards': card_stats['card_count'],
                'decks': deck_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

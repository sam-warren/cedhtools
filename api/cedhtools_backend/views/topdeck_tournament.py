from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import TopdeckTournament
from ..serializers import TopdeckTournamentSerializer


class TopdeckTournamentView(APIView):
    """
    Fetch details of a specific tournament, including player standings and their decks.
    """

    def get(self, request, tournament_id):
        # Fetch the tournament or return a 404
        tournament = get_object_or_404(TopdeckTournament, tid=tournament_id)

        # Serialize tournament data (use a custom serializer for nested data)
        serializer = TopdeckTournamentSerializer(tournament)

        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import TopdeckPlayerStanding
from ..serializers import TopdeckPlayerStandingSerializer


class TestView(APIView):
    """
    API to fetch a player's standing and their deck details in a tournament.
    """

    def get(self, request, player_id):
        # Get the player's standing (or return 404)
        standing = TopdeckPlayerStanding.objects.select_related(
            'deck').get(id=player_id)

        # Serialize the player's standing
        serializer = TopdeckPlayerStandingSerializer(standing)
        return Response(serializer.data)

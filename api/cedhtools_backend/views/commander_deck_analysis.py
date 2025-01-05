from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..services.commander.commander_service import CommanderService
from ..services.deck.deck_service import DeckService
from ..serializers import CommanderStatisticsResponseSerializer


class CommanderDeckAnalysisView(APIView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.commander_service = CommanderService()
        self.deck_service = DeckService()

    def get(self, request, deck_id):
        try:
            # Get deck data and analyze it
            statistics = self.commander_service.get_commander_statistics(
                deck_id)

            # Serialize the response
            serializer = CommanderStatisticsResponseSerializer(statistics)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred " + str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

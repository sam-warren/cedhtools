from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from typing import Optional
from ..services.commander.commander_service import CommanderService
from ..services.deck.deck_service import DeckService
from ..serializers import CommanderStatisticsResponseSerializer


class CommanderDeckAnalysisView(APIView):
    permission_classes = [AllowAny]  # Add permission if needed

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.commander_service = CommanderService()
        self.deck_service = DeckService()

    def get(self, request, deck_id):
        # Extract query parameters with default values
        time_period = request.query_params.get('time_period', 'ban')
        min_size = request.query_params.get('min_size', 0)

        try:
            # Validate and convert min_size to integer
            try:
                min_size = int(min_size)
            except ValueError:
                return Response(
                    {"error": "Invalid tournament size"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate time_period
            valid_time_periods = ['1m', '3m', '6m', '1y', 'ban', 'all']
            if time_period not in valid_time_periods:
                return Response(
                    {"error": "Invalid time period"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get deck data and analyze it with new parameters
            statistics = self.commander_service.get_commander_statistics(
                deck_id,
                time_period=time_period,
                min_size=min_size
            )

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

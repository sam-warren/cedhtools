from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..services.commander.commander_service import CommanderService
from ..serializers import CommanderStatisticsResponseSerializer


class CommanderStatisticsView(APIView):
    """
    Get statistics about specific commanders without requiring a deck.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.commander_service = CommanderService()

    def get(self, request):
        try:
            # Get commander IDs from query parameters
            commander_ids = request.query_params.getlist('commander_ids')
            if not commander_ids:
                return Response(
                    {"error": "commander_ids parameter is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get statistics for these commanders
            statistics = self.commander_service.calculate_commander_statistics(
                commander_ids
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
                {"error": "An unexpected error occurred: " + str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

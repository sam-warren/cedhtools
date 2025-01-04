from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from ..models import CEDHToolsMetrics
from rest_framework import serializers
import logging

logger = logging.getLogger(__name__)


class MetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CEDHToolsMetrics
        fields = ('total_decks', 'total_tournaments', 'total_unique_cards')


class MetricsView(APIView):
    """
    API endpoint that returns key metrics about CEDH Tools data.
    The data is served from a materialized view and cached for optimal performance.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Get the first (and only) row from materialized view
            metrics = CEDHToolsMetrics.objects.first()

            if not metrics:
                logger.error("No data found in metrics materialized view")
                return Response(
                    {"error": "Metrics data not available"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Serialize the data
            serializer = MetricsSerializer(metrics)
            data = serializer.data

            # Cache the results
            return Response(data)

        except Exception as e:
            logger.exception("Error fetching metrics data")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Avg, Q
from ..models import CommanderCardStats


class CommanderStatisticsView(APIView):
    """
    API endpoint to fetch average win rate and draw rate for specific commander(s),
    with optional filtering by start_date, end_date, tournament_size, and top_cut.
    """

    def get(self, request, *args, **kwargs):
        # Extract query parameters
        commander_ids = request.query_params.getlist(
            "commander_ids")  # Required
        start_date = request.query_params.get("start_date")  # Optional
        end_date = request.query_params.get("end_date")  # Optional
        tournament_size = request.query_params.get(
            "tournament_size")  # Optional
        top_cut = request.query_params.get("top_cut")  # Optional

        # Validate commander_ids
        if not commander_ids:
            raise ValidationError(
                {"error": "commander_ids is required and must be a list."})

        # Build query filters dynamically using Q objects
        filters = Q()
        # Match at least one commander ID
        filters &= Q(commander_ids__overlap=commander_ids)
        if start_date:
            filters &= Q(start_date__gte=int(start_date))
        if end_date:
            filters &= Q(start_date__lte=int(end_date))
        if tournament_size:
            filters &= Q(tournament_size=int(tournament_size))
        if top_cut:
            filters &= Q(top_cut=int(top_cut))

        # Query the ORM with the filters and aggregate results
        stats = CommanderCardStats.objects.filter(filters).aggregate(
            avg_win_rate=Avg("avg_win_rate"),
            avg_draw_rate=Avg("avg_draw_rate")
        )

        # Return results
        return Response({
            "commander_ids": commander_ids,
            "avg_win_rate": stats["avg_win_rate"] or 0.0,
            "avg_draw_rate": stats["avg_draw_rate"] or 0.0
        }, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Avg, Q, Count
from scipy.stats import chi2_contingency
from ..models import CommanderCardStats

import numpy as np  # Import NumPy for epsilon handling


class CommanderStatisticsView(APIView):
    """
    API endpoint to fetch average win rate, draw rate for specific commander(s),
    and individual card statistics (with Chi-squared test) for decks matching the selected filters.
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
        # Match exact commander ID combinations using sorted arrays
        filters &= Q(commander_ids__exact=sorted(commander_ids))
        if start_date:
            filters &= Q(start_date__gte=int(start_date))
        if end_date:
            filters &= Q(start_date__lte=int(end_date))
        if tournament_size:
            filters &= Q(tournament_size=int(tournament_size))
        if top_cut:
            filters &= Q(top_cut=int(top_cut))

        # Query for commander-level statistics
        commander_stats = CommanderCardStats.objects.filter(filters).aggregate(
            # Count decks based on unique card IDs
            total_decks=Count("unique_card_id"),
            avg_win_rate=Avg("avg_win_rate"),
            avg_draw_rate=Avg("avg_draw_rate"),
        )

        # Default values if no results
        total_decks = commander_stats["total_decks"] or 0
        avg_win_rate = commander_stats["avg_win_rate"] or 0.0
        avg_draw_rate = commander_stats["avg_draw_rate"] or 0.0

        # Query for individual card statistics
        card_stats = CommanderCardStats.objects.filter(filters).values(
            "unique_card_id",
            "card_name"
        ).annotate(
            total_decks=Count("unique_card_id"),  # Count per unique_card_id
            avg_win_rate=Avg("avg_win_rate"),
            avg_draw_rate=Avg("avg_draw_rate")
        ).order_by("-avg_win_rate")

        # Compute Chi-squared test for each card
        card_stats_list = []
        epsilon = 1e-6  # Small value to avoid zero in expected counts
        for card in card_stats:
            total_card_decks = card["total_decks"]
            win_rate = card["avg_win_rate"] or 0.0
            draw_rate = card["avg_draw_rate"] or 0.0
            loss_rate = 1.0 - win_rate - draw_rate

            # Only compute if the card appears in decks
            if total_card_decks > 0:
                # Observed counts
                observed = [
                    total_card_decks * win_rate,   # Observed wins
                    total_card_decks * draw_rate,  # Observed draws
                    total_card_decks * loss_rate   # Observed losses
                ]

                # Non-uniform expected counts: 25% wins, 0% draws, 75% losses (with epsilon adjustment)
                expected = [
                    total_card_decks * 0.25 + epsilon,  # Expected 25% wins
                    total_card_decks * 0.0 + epsilon,   # Expected 0% draws
                    total_card_decks * 0.75 + epsilon   # Expected 75% losses
                ]

                # Perform Chi-squared test
                chi2, p_value, _, _ = chi2_contingency([observed, expected])
            else:
                chi2, p_value = None, None

            card_stats_list.append({
                "unique_card_id": card["unique_card_id"],  # Unique card ID
                "card_name": card["card_name"],
                "total_decks": total_card_decks,
                "avg_win_rate": win_rate,
                "avg_draw_rate": draw_rate,
                "chi_squared": chi2,
                "p_value": p_value,
                "statistically_significant": p_value is not None and p_value < 0.05
            })

        # Return the response
        return Response({
            "commander_ids": commander_ids,
            "avg_win_rate": avg_win_rate,
            "avg_draw_rate": avg_draw_rate,
            "card_statistics": card_stats_list
        }, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Avg, Q, Count
from scipy.stats import chi2_contingency
from ..models import CommanderCardStats


class CommanderStatisticsView(APIView):
    """
    API endpoint to fetch average win rate, draw rate for specific commander(s),
    and individual card statistics (with Chi-squared test) for decks matching the selected filters.
    """

    def get(self, request, *args, **kwargs):
        # Extract query parameters
        commander_ids = request.query_params.getlist(
            "commander_ids")  # Required list of commander IDs to filter decks
        # Optional: Filter by tournaments starting on or after this date
        start_date = request.query_params.get("start_date")
        # Optional: Filter by tournaments ending on or before this date
        end_date = request.query_params.get("end_date")
        tournament_size = request.query_params.get(
            "tournament_size")  # Optional: Minimum tournament size to include
        # Optional: Specific top cut size to filter tournaments
        top_cut = request.query_params.get("top_cut")

        # Validate commander_ids
        if not commander_ids:
            # Raise an error if no commander IDs are provided (mandatory parameter)
            raise ValidationError(
                {"error": "commander_ids is required and must be a list."})

        # Build query filters dynamically using Q objects
        filters = Q()  # Initialize the filter object
        # Match exact commander ID combinations using sorted arrays
        # Ensure the commander_ids match exactly as a sorted list
        filters &= Q(commander_ids__exact=sorted(commander_ids))
        if start_date:
            # Include tournaments starting on or after start_date
            filters &= Q(start_date__gte=int(start_date))
        if end_date:
            # Include tournaments starting on or before end_date
            filters &= Q(start_date__lte=int(end_date))
        if tournament_size:
            filters &= Q(tournament_size__gte=int(
                tournament_size))  # Include tournaments with size >= tournament_size
        if top_cut:
            # Include tournaments with the specified top cut size
            filters &= Q(top_cut=int(top_cut))

        # Query for commander-level statistics (aggregated across all matching decks)
        commander_stats = CommanderCardStats.objects.filter(filters).aggregate(
            # Total number of decks matching the filters (based on unique_card_id to avoid duplicates)
            total_decks=Count("deck_id", distinct=True),
            # Average win rate across all matching decks
            avg_win_rate=Avg("avg_win_rate"),
            # Average draw rate across all matching decks
            avg_draw_rate=Avg("avg_draw_rate"),
        )
        # Default values if no results are returned
        # Default to 0 if no decks are found
        total_decks = commander_stats["total_decks"] or 0
        # Default to 0.0 for win rate
        avg_win_rate = commander_stats["avg_win_rate"] or 0.0
        # Default to 0.0 for draw rate
        avg_draw_rate = commander_stats["avg_draw_rate"] or 0.0

        # Query for individual card statistics
        card_stats = CommanderCardStats.objects.filter(filters).values(
            "unique_card_id",  # Unique identifier for the card regardless of printing and version
            "card_name"        # Name of the card
        ).annotate(
            # Count of decks that include this card (per unique_card_id)
            total_decks=Count("deck_id", distinct=True),
            # Average win rate for decks including this card
            avg_win_rate=Avg("avg_win_rate"),
            # Average draw rate for decks including this card
            avg_draw_rate=Avg("avg_draw_rate")
        ).order_by("-avg_win_rate")  # Order cards by descending average win rate

        # Compute Chi-squared test for each card to determine statistical significance
        card_stats_list = []  # Initialize list to store processed card statistics
        epsilon = 1e-6  # Small value to avoid division by zero or zero expected counts
        for card in card_stats:
            # Total number of decks that include this card
            total_card_decks = card["total_decks"]
            # Average win rate for this card (default to 0.0)
            win_rate = card["avg_win_rate"] or 0.0
            # Average draw rate for this card (default to 0.0)
            draw_rate = card["avg_draw_rate"] or 0.0
            loss_rate = 1.0 - win_rate - draw_rate  # Calculate loss rate as the remainder

            # Only compute Chi-squared if the card appears in decks
            if total_card_decks > 0:
                # Observed counts based on the win, draw, and loss rates
                observed = [
                    total_card_decks * win_rate,   # Observed wins
                    total_card_decks * draw_rate,  # Observed draws
                    total_card_decks * loss_rate   # Observed losses
                ]

                # Non-uniform expected counts: 25% wins, 0% draws, 75% losses (with epsilon adjustment)
                expected = [
                    total_card_decks * 0.23 + epsilon,  # Expected 23% wins
                    total_card_decks * 0.05 + epsilon,  # Expected 5% draws
                    total_card_decks * 0.72 + epsilon   # Expected 72% losses
                ]

                # Perform Chi-squared test to compare observed vs. expected counts
                chi2, p_value, _, _ = chi2_contingency([observed, expected])
            else:
                chi2, p_value = None, None  # No Chi-squared test if no decks include the card

            # Add the processed card statistics to the list
            card_stats_list.append({
                "unique_card_id": card["unique_card_id"],  # Unique card ID
                "card_name": card["card_name"],           # Card name
                "total_decks": total_card_decks,          # Total decks including this card
                "avg_win_rate": win_rate,                 # Average win rate
                "avg_draw_rate": draw_rate,               # Average draw rate
                "chi_squared": chi2,                      # Chi-squared statistic
                "p_value": p_value,                       # P-value for the Chi-squared test
                # True if p-value < 0.05
                "statistically_significant": p_value is not None and p_value < 0.05
            })

        # Return the response
        return Response({
            "commander_ids": commander_ids,  # Input commander IDs
            "total_decks": total_decks,      # Total number of decks matching the filters
            "avg_win_rate": avg_win_rate,   # Aggregated average win rate across all decks
            "avg_draw_rate": avg_draw_rate,  # Aggregated average draw rate across all decks
            "card_statistics": card_stats_list,  # Detailed statistics for individual cards
        }, status=status.HTTP_200_OK)

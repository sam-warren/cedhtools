from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db.models import Avg, Q, Count
from scipy.stats import chi2_contingency
from ..models import CommanderCardStats


class CommanderStatisticsView(APIView):
    def get(self, request, *args, **kwargs):
        # Extract query parameters
        commander_ids = sorted(request.query_params.getlist("commander_ids"))
        if not commander_ids:
            raise ValidationError(
                {"error": "commander_ids is required and must be a list."}
            )

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        tournament_size = request.query_params.get("tournament_size")
        top_cut = request.query_params.get("top_cut")

        # Build filters
        filters = Q(commander_ids__exact=commander_ids)
        if start_date:
            filters &= Q(start_date__gte=start_date)
        if end_date:
            filters &= Q(start_date__lte=end_date)
        if tournament_size:
            filters &= Q(tournament_size__gte=tournament_size)
        if top_cut:
            filters &= Q(top_cut=top_cut)

        # Query commander stats grouped by unique_card_id
        card_stats = (
            CommanderCardStats.objects.filter(filters)
            .values(
                "unique_card_id",
                "card_face_name",
                "card_face_mana_cost",
                "card_face_type_line",
                "card_face_oracle_text",
                "card_face_colors",
                "card_face_image_uris",
            )
            .annotate(
                total_decks=Count("deck_id", distinct=True),
                win_rate=Avg("win_rate"),
                draw_rate=Avg("draw_rate"),
            )
        )

        # Process chi-squared and build the response
        card_stats_list = []
        for card in card_stats:
            chi2, p_value = self.compute_chi_squared(card)
            card_stats_list.append({
                "unique_card_id": card["unique_card_id"],
                "total_decks": card["total_decks"],
                "win_rate": card["win_rate"],
                "draw_rate": card["draw_rate"],
                "card_face_name": card["card_face_name"],
                "card_face_mana_cost": card["card_face_mana_cost"],
                "card_face_type_line": card["card_face_type_line"],
                "card_face_oracle_text": card["card_face_oracle_text"],
                "card_face_colors": card["card_face_colors"],
                "card_face_image_uris": card["card_face_image_uris"],
                "chi_squared": chi2,
                "p_value": p_value,
            })

        # Aggregate commander-level stats
        commander_stats = CommanderCardStats.objects.filter(filters).aggregate(
            total_decks=Count("deck_id", distinct=True),
            win_rate=Avg("win_rate"),
            draw_rate=Avg("draw_rate"),
        )

        return Response({
            "commander_ids": commander_ids,
            "total_decks": commander_stats.get("total_decks", 0),
            "win_rate": commander_stats.get("win_rate", 0.0),
            "draw_rate": commander_stats.get("draw_rate", 0.0),
            "card_statistics": card_stats_list,
        }, status=status.HTTP_200_OK)

    def compute_chi_squared(self, card):
        """
        Compute the chi-squared test for win, draw, and loss rates of a card.
        """
        total_card_decks = card["total_decks"]
        win_rate = card["win_rate"] or 0.0
        draw_rate = card["draw_rate"] or 0.0
        loss_rate = 1.0 - win_rate - draw_rate

        if total_card_decks > 0:
            observed = [
                total_card_decks * win_rate,
                total_card_decks * draw_rate,
                total_card_decks * loss_rate,
            ]
            expected = [
                total_card_decks * 0.23,  # Example expected win rate
                total_card_decks * 0.05,  # Example expected draw rate
                total_card_decks * 0.72,  # Example expected loss rate
            ]
            chi2, p_value, _, _ = chi2_contingency([observed, expected])
            return chi2, p_value
        return None, None

from django.db.models import Avg, F, Q, Count
from django.db.models.functions import Sqrt
from django.db.models.functions import PercentRank
from django.contrib.postgres.aggregates import ArrayAgg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from scipy import stats
import numpy as np
from ..services.moxfield import MoxfieldClient
from ..services.scryfall import ScryfallClient
from ..models import MoxfieldDeck, MoxfieldCard, TopdeckPlayerStanding


class CommanderStatisticsView(APIView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.moxfield_client = MoxfieldClient()
        self.scryfall_client = ScryfallClient()

    def get(self, request, deck_id):
        try:
            # Get commander information from Moxfield
            deck_response = self.moxfield_client.fetch_deck(deck_id)

            if deck_response["error"]:
                return Response(
                    {"error": deck_response["error_message"]},
                    status=deck_response["status"]
                )

            commanders = self._extract_commanders(deck_response["data"])
            if not commanders:
                return Response(
                    {"error": "No commanders found in deck"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            stats = self._calculate_card_statistics(commanders)

            # Enrich statistics with Scryfall data TODO: Finish implementing this.
            enriched_stats = self._enrich_with_scryfall_data(stats)

            return Response(enriched_stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _extract_commanders(self, deck_data):
        """Extract commander card IDs from deck data."""
        commanders = []
        commander_board = deck_data.get("boards", {}).get("commanders", {})

        for card_data in commander_board.get("cards", {}).values():
            card_info = card_data.get("card", {})
            if card_info.get("uniqueCardId"):
                commanders.append(card_info["uniqueCardId"])

        return sorted(commanders)

    def _calculate_card_statistics(self, commander_ids):
        """Calculate comprehensive statistics for each card played with these commanders."""
        matching_decks = self._find_matching_commander_decks(commander_ids)

        # Calculate meta statistics
        meta_stats = self._calculate_meta_statistics(matching_decks)

        # Calculate per-card statistics
        card_stats = self._calculate_per_card_stats(matching_decks, meta_stats)

        return {
            "meta_statistics": meta_stats,
            "card_statistics": card_stats
        }

    def _find_matching_commander_decks(self, commander_ids):
        base_query = MoxfieldDeck.objects.filter(
            moxfielddeckcard__card__unique_card_id__in=commander_ids,
            moxfielddeckcard__board='commanders'
        )

        matching_decks = base_query.annotate(
            commander_list=ArrayAgg(
                'moxfielddeckcard__card__unique_card_id',
                filter=Q(moxfielddeckcard__board='commanders'),
                ordering='moxfielddeckcard__card__unique_card_id'
            )
        ).filter(commander_list=sorted(commander_ids))
        return matching_decks

    def _calculate_meta_statistics(self, matching_decks):
        """Calculate meta-level statistics for the commander(s)."""
        matches = TopdeckPlayerStanding.objects.filter(deck__in=matching_decks)

        stats = matches.aggregate(
            total_decks=Count('deck', distinct=True),
            avg_win_rate=Avg('win_rate'),
            avg_draw_rate=Avg('draw_rate'),
            avg_loss_rate=Avg('loss_rate')
        )

        return {
            "sample_size": {
                "total_decks": stats['total_decks'],
            },
            "baseline_performance": {
                "win_rate": stats['avg_win_rate'],
                "draw_rate": stats['avg_draw_rate'],
                "loss_rate": stats['avg_loss_rate']
            }
        }

    def _calculate_per_card_stats(self, matching_decks, meta_stats):
        """Calculate detailed statistics for each card."""
        cards_query = MoxfieldCard.objects.filter(
            moxfielddeckcard__deck__in=matching_decks,
            moxfielddeckcard__board='mainboard'
        ).annotate(
            decks_with_card=Count('moxfielddeckcard__deck', distinct=True),
            avg_win_rate=Avg(
                'moxfielddeckcard__deck__player_standings__win_rate'),
            avg_draw_rate=Avg(
                'moxfielddeckcard__deck__player_standings__draw_rate'),
            avg_loss_rate=Avg(
                'moxfielddeckcard__deck__player_standings__loss_rate')
        ).values(
            'unique_card_id',
            'scryfall_id',
            'decks_with_card',
            'avg_win_rate',
            'avg_draw_rate',
            'avg_loss_rate'
        )

        card_stats = []
        for card in cards_query:
            card_stats.append({
                'unique_card_id': card['unique_card_id'],
                'scryfall_id': str(card['scryfall_id']),
                'sample_size': {
                    'decks': card['decks_with_card'],
                },
                'performance': {
                    'win_rate': card['avg_win_rate'],
                    'draw_rate': card['avg_draw_rate'],
                    'loss_rate': card['avg_loss_rate']
                },
            })

        return card_stats

    def _enrich_with_scryfall_data(self, stats):
        """Enrich card statistics with Scryfall data."""

        return stats

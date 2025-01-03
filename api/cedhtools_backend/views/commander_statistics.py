from django.db.models import Avg, F, Q, Count, OuterRef, Subquery
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

            return Response(stats, status=status.HTTP_200_OK)
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
        """Calculate detailed statistics for each card, aggregated by unique_card_id."""

        # First calculate all statistics grouped by unique_card_id
        stats_by_unique_id = MoxfieldCard.objects.filter(
            moxfielddeckcard__deck__in=matching_decks,
            moxfielddeckcard__board='mainboard'
        ).values('unique_card_id').annotate(
            # Aggregated statistics across ALL printings
            decks_with_card=Count('moxfielddeckcard__deck', distinct=True),
            avg_win_rate=Avg(
                'moxfielddeckcard__deck__player_standings__win_rate'),
            avg_draw_rate=Avg(
                'moxfielddeckcard__deck__player_standings__draw_rate'),
            avg_loss_rate=Avg(
                'moxfielddeckcard__deck__player_standings__loss_rate')
        )

        # Convert to dictionary for easy lookup
        stats_lookup = {
            stat['unique_card_id']: {
                'decks_with_card': stat['decks_with_card'],
                'avg_win_rate': stat['avg_win_rate'],
                'avg_draw_rate': stat['avg_draw_rate'],
                'avg_loss_rate': stat['avg_loss_rate']
            } for stat in stats_by_unique_id
        }

        # Subquery to get the latest printing for each unique_card_id
        latest_printing = MoxfieldCard.objects.filter(
            unique_card_id=OuterRef('unique_card_id')
        ).order_by('-scryfall_card__released_at', 'scryfall_card__collector_number').values('scryfall_card_id')[:1]

        # Now get one representative card (with Scryfall data) for each unique_card_id
        representative_cards = MoxfieldCard.objects.filter(
            unique_card_id__in=stats_lookup.keys(),
            scryfall_card_id=Subquery(latest_printing)
        ).values(
            'unique_card_id',
            'scryfall_card__id',
            'scryfall_card__name',
            'scryfall_card__type_line',
            'scryfall_card__cmc',
            'scryfall_card__image_uris',
            'scryfall_card__legality',
            'scryfall_card__mana_cost',
            'scryfall_card__scryfall_uri'
        )

        # Combine the statistics with the representative card data
        card_stats = []
        for card in representative_cards:
            stats = stats_lookup[card['unique_card_id']]
            card_stats.append({
                'unique_card_id': card['unique_card_id'],
                'scryfall_id': str(card['scryfall_card__id']),
                'name': card['scryfall_card__name'],
                'type_line': card['scryfall_card__type_line'],
                'cmc': card['scryfall_card__cmc'],
                'image_uris': card['scryfall_card__image_uris'],
                'legality': card['scryfall_card__legality'],
                'mana_cost': card['scryfall_card__mana_cost'],
                'scryfall_uri': card['scryfall_card__scryfall_uri'],
                'sample_size': {
                    'decks': stats['decks_with_card'],
                },
                'performance': {
                    'win_rate': stats['avg_win_rate'],
                    'draw_rate': stats['avg_draw_rate'],
                    'loss_rate': stats['avg_loss_rate']
                },
            })

        return card_stats

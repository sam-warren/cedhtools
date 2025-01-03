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
from ..models import MoxfieldDeck, MoxfieldCard, TopdeckPlayerStanding, CommanderDeckRelationships, CardStatisticsByCommander


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

            commander_info = self._extract_commanders(deck_response["data"])
            if not commander_info["commander_ids"]:
                return Response(
                    {"error": "No commanders found in deck"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            stats = self._calculate_card_statistics(
                commander_info["commander_ids"])

            # Add commander details to the response
            stats["commanders"] = commander_info["commander_details"]

            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _extract_commanders(self, deck_data):
        """Extract commander card IDs and their Scryfall details from deck data."""
        commander_ids = []
        commander_details = []
        commander_board = deck_data.get("boards", {}).get("commanders", {})

        # Subquery to get the latest printing for each unique_card_id
        latest_printing = MoxfieldCard.objects.filter(
            unique_card_id=OuterRef('unique_card_id')
        ).order_by('-scryfall_card__released_at', 'scryfall_card__collector_number').values('scryfall_card_id')[:1]

        for card_data in commander_board.get("cards", {}).values():
            card_info = card_data.get("card", {})
            if card_info.get("uniqueCardId"):
                commander_ids.append(card_info["uniqueCardId"])

                # Get Scryfall details for this commander
                commander_card = MoxfieldCard.objects.filter(
                    unique_card_id=card_info["uniqueCardId"],
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
                ).first()

                if commander_card:
                    commander_details.append({
                        'unique_card_id': commander_card['unique_card_id'],
                        'scryfall_id': str(commander_card['scryfall_card__id']),
                        'name': commander_card['scryfall_card__name'],
                        'type_line': commander_card['scryfall_card__type_line'],
                        'cmc': commander_card['scryfall_card__cmc'],
                        'image_uris': commander_card['scryfall_card__image_uris'],
                        'legality': commander_card['scryfall_card__legality'],
                        'mana_cost': commander_card['scryfall_card__mana_cost'],
                        'scryfall_uri': commander_card['scryfall_card__scryfall_uri']
                    })

        return {
            "commander_ids": sorted(commander_ids),
            "commander_details": sorted(commander_details, key=lambda x: x['name'])
        }

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
        """Find decks that contain exactly these commanders using the materialized view."""
        return MoxfieldDeck.objects.filter(
            id__in=CommanderDeckRelationships.objects.filter(
                commander_list=sorted(commander_ids)
            ).values('deck_id')
        )

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
        """Get card statistics and calculate chi-squared test for each card."""
        commander_list = list(CommanderDeckRelationships.objects.filter(
            deck_id=matching_decks.first().id
        ).values_list('commander_list', flat=True))[0]

        # Get deck performances including both rates and raw counts
        deck_performances = TopdeckPlayerStanding.objects.filter(
            deck__in=matching_decks
        ).values(
            'deck_id',
            'win_rate',
            'draw_rate',
            'loss_rate',
            'wins',
            'draws',
            'losses'
        )

        # Get all deck-card relationships in one query
        deck_cards = MoxfieldDeck.objects.filter(
            id__in=matching_decks
        ).values(
            'id',
            'moxfielddeckcard__card__unique_card_id'
        ).distinct()

        # Create lookup dictionaries for faster processing
        deck_perf_lookup = {
            perf['deck_id']: perf for perf in deck_performances
        }

        deck_card_lookup = {}
        for dc in deck_cards:
            card_id = dc['moxfielddeckcard__card__unique_card_id']
            if card_id:
                if card_id not in deck_card_lookup:
                    deck_card_lookup[card_id] = set()
                deck_card_lookup[card_id].add(dc['id'])

        # Calculate statistics for each card
        card_stats = []
        for unique_card_id, deck_ids in deck_card_lookup.items():
            decks_with_card = []
            decks_without_card = []

            # Split decks into with/without card and collect their performances
            for deck_id, perf in deck_perf_lookup.items():
                if deck_id in deck_ids:
                    decks_with_card.append(perf)
                else:
                    decks_without_card.append(perf)

            # Calculate average rates
            win_rate_with = np.mean(
                [d['win_rate'] for d in decks_with_card]) if decks_with_card else 0
            win_rate_without = np.mean(
                [d['win_rate'] for d in decks_without_card]) if decks_without_card else 0

            # Create contingency table for chi-squared test using raw counts
            # [wins, draws, losses] for [with_card, without_card]
            with_card = np.zeros((2, 3))
            for perf in decks_with_card:
                with_card[0] += [perf['wins'], perf['draws'], perf['losses']]
            for perf in decks_without_card:
                with_card[1] += [perf['wins'], perf['draws'], perf['losses']]

            # Calculate chi-squared test
            try:
                if np.all(with_card.sum(axis=0) > 0) and np.all(with_card.sum(axis=1) > 0):
                    chi2, p_value = stats.chi2_contingency(with_card)[:2]
                else:
                    chi2, p_value = 0.0, 1.0
            except Exception:
                chi2, p_value = 0.0, 1.0

            # Get card details and create response
            card_details = MoxfieldCard.objects.filter(
                unique_card_id=unique_card_id
            ).select_related('scryfall_card').first()

            if card_details and card_details.scryfall_card:
                card_stats.append({
                    'unique_card_id': unique_card_id,
                    'scryfall_id': str(card_details.scryfall_card.id),
                    'name': card_details.scryfall_card.name,
                    'type_line': card_details.scryfall_card.type_line,
                    'cmc': card_details.scryfall_card.cmc,
                    'image_uris': card_details.scryfall_card.image_uris,
                    'legality': card_details.scryfall_card.legality,
                    'mana_cost': card_details.scryfall_card.mana_cost,
                    'scryfall_uri': card_details.scryfall_card.scryfall_uri,
                    'sample_size': {
                        'decks_with_card': len(decks_with_card),
                        'decks_without_card': len(decks_without_card)
                    },
                    'performance': {
                        'win_rate_with_card': float(win_rate_with),
                        'win_rate_without_card': float(win_rate_without),
                        'chi_squared': float(chi2),
                        'p_value': float(p_value)
                    }
                })

        return card_stats

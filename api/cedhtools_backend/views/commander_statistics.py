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
        # Get deck performances first
        deck_performances = list(TopdeckPlayerStanding.objects.filter(
            deck__in=matching_decks
        ).values(
            'deck_id',
            'win_rate',
            'wins',
            'draws',
            'losses'
        ))

        # Create performance lookup
        deck_perf_lookup = {
            perf['deck_id']: perf for perf in deck_performances
        }

        # Get card-deck relationships
        deck_cards = list(MoxfieldDeck.objects.filter(
            id__in=matching_decks
        ).values(
            'id',
            'moxfielddeckcard__card__unique_card_id'
        ).distinct())

        # Create card-deck lookup
        deck_card_lookup = {}
        for dc in deck_cards:
            card_id = dc['moxfielddeckcard__card__unique_card_id']
            if card_id:
                if card_id not in deck_card_lookup:
                    deck_card_lookup[card_id] = set()
                deck_card_lookup[card_id].add(dc['id'])

        # Get card details in bulk
        unique_card_ids = list(deck_card_lookup.keys())
        cards_query = MoxfieldCard.objects.filter(
            unique_card_id__in=unique_card_ids
        ).select_related('scryfall_card')

        # Create card details lookup (taking first card for each unique_card_id)
        card_details_lookup = {}
        for card in cards_query:
            if card.unique_card_id not in card_details_lookup:
                card_details_lookup[card.unique_card_id] = card

        # Calculate statistics
        card_stats = []
        deck_ids = set(deck_perf_lookup.keys())

        for unique_card_id, deck_ids_with_card in deck_card_lookup.items():
            decks_with = deck_ids_with_card & deck_ids
            decks_without = deck_ids - decks_with

            perfs_with = [deck_perf_lookup[d_id] for d_id in decks_with]
            perfs_without = [deck_perf_lookup[d_id] for d_id in decks_without]

            if not perfs_with:  # Skip if no performance data
                continue

            # Calculate win rate
            win_rate = np.mean([p['win_rate'] for p in perfs_with])

            # Chi-squared calculation using numpy arrays for better performance
            game_results = np.array([[sum(p['wins'] for p in perfs_with),
                                    sum(p['draws'] for p in perfs_with),
                                    sum(p['losses'] for p in perfs_with)],
                                     [sum(p['wins'] for p in perfs_without),
                                    sum(p['draws'] for p in perfs_without),
                                    sum(p['losses'] for p in perfs_without)]])

            try:
                if np.all(game_results.sum(axis=0) > 0) and np.all(game_results.sum(axis=1) > 0):
                    chi2, p_value = stats.chi2_contingency(game_results)[:2]
                else:
                    chi2, p_value = 0.0, 1.0
            except Exception:
                chi2, p_value = 0.0, 1.0

            # Get card details from lookup
            card_details = card_details_lookup.get(unique_card_id)
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
                    'decks_with_card': len(decks_with),
                    'performance': {
                        'card_win_rate': float(win_rate),
                        'chi_squared': float(chi2),
                        'p_value': float(p_value)
                    }
                })

        return card_stats

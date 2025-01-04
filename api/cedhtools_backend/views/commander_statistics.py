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
from ..models import MoxfieldDeck, MoxfieldCard, TopdeckPlayerStanding, CommanderDeckRelationships, CardStatisticsByCommander, CardPrintings


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

            deck_structure = self._get_deck_structure(deck_response["data"])

            stats = self._calculate_card_statistics(
                commander_info["commander_ids"], deck_structure)

            # Add commander details to the response
            stats["commanders"] = commander_info["commander_details"]

            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_deck_structure(self, deck_data):
        """
        Build a lookup table that categorizes each card's board name
        and numeric type (1 = battle, 2 = planeswalker, etc.),
        but only from the 'mainboard' and 'companions' boards.
        """
        deck_structure = {}
        # Restrict to specific boards
        valid_boards = {"mainboard", "companions"}

        for board_name, board_data in deck_data.get("boards", {}).items():
            # Skip boards not in valid_boards
            if board_name not in valid_boards:
                continue

            for card_data in board_data.get("cards", {}).values():
                card_info = card_data.get("card", {})
                unique_id = card_info.get("uniqueCardId")
                if unique_id:
                    deck_structure[unique_id] = {
                        "board": board_name,
                        "type": card_info["type"]
                    }

        return deck_structure

    def _extract_commanders(self, deck_data):
        """Extract commander card IDs and their Scryfall details from deck data."""
        commander_ids = []
        commander_details = []
        commander_board = deck_data.get("boards", {}).get("commanders", {})

        for card_data in commander_board.get("cards", {}).values():
            card_info = card_data.get("card", {})
            if card_info.get("uniqueCardId"):
                commander_ids.append(card_info["uniqueCardId"])

                # Get the most popular printing from our materialized view
                popular_printing = CardPrintings.objects.filter(
                    unique_card_id=card_info["uniqueCardId"]
                ).first()

                if popular_printing:
                    # Get Scryfall details for this commander
                    commander_card = MoxfieldCard.objects.filter(
                        unique_card_id=card_info["uniqueCardId"],
                        scryfall_card_id=popular_printing.most_common_printing
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

    def _calculate_card_statistics(self, commander_ids, deck_structure):
        """Calculate comprehensive statistics for each card played with these commanders."""
        matching_decks = self._find_matching_commander_decks(commander_ids)

        # Calculate meta statistics
        meta_stats = self._calculate_meta_statistics(matching_decks)

        # Calculate per-card statistics
        card_stats = self._calculate_per_card_stats(
            matching_decks, meta_stats, deck_structure, commander_ids)

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

    def _calculate_per_card_stats(self, matching_decks, meta_stats, deck_structure, commander_ids):
        """
        Get card statistics and calculate chi-squared test for each card.
        Also organizes the final data into 'main' (grouped by type) and 'other' (cards not in the submitted deck structure).
        """
        # Pull all the deck performances
        deck_performances = list(
            TopdeckPlayerStanding.objects.filter(deck__in=matching_decks)
            .values('deck_id', 'win_rate', 'wins', 'draws', 'losses')
        )

        # Create a lookup from deck_id -> performance info
        deck_perf_lookup = {perf['deck_id']
            : perf for perf in deck_performances}

        # Get the unique_card_ids used across these decks
        deck_cards = list(
            MoxfieldDeck.objects.filter(id__in=matching_decks)
            .values('id', 'moxfielddeckcard__card__unique_card_id')
            .distinct()
        )

        deck_ids = set(deck_perf_lookup.keys())
        deck_card_lookup = {}

        for dc in deck_cards:
            card_id = dc['moxfielddeckcard__card__unique_card_id']
            if card_id:
                deck_card_lookup.setdefault(card_id, set()).add(dc['id'])

        unique_card_ids = list(deck_card_lookup.keys())

        # Use our helper to get the earliest printing
        card_details_lookup = {}
        for uc_id in unique_card_ids:
            earliest_card = self._get_most_popular_printing(uc_id)
            if earliest_card:
                card_details_lookup[uc_id] = earliest_card

        # Prepare the final structure
        # 'main_cards' is a dict with keys "1" through "8", each an empty list
        main_cards = {str(i): [] for i in range(1, 9)}
        other_cards = []

        # Calculate statistics for each unique_card_id
        for unique_card_id, deck_ids_with_card in deck_card_lookup.items():
            # Skip commanders
            if unique_card_id in commander_ids:
                continue
            decks_with = deck_ids_with_card & deck_ids
            decks_without = deck_ids - decks_with

            # Performance info
            perfs_with = [deck_perf_lookup[d_id]
                          for d_id in decks_with if d_id in deck_perf_lookup]
            perfs_without = [deck_perf_lookup[d_id]
                             for d_id in decks_without if d_id in deck_perf_lookup]

            # If no performance data with the card, skip
            if not perfs_with:
                continue

            # Calculate raw average win rate of the decks that run this card
            total_wins_with = sum(p['wins'] for p in perfs_with)
            total_draws_with = sum(p['draws'] for p in perfs_with)
            total_losses_with = sum(p['losses'] for p in perfs_with)
            total_games_with = total_wins_with + total_draws_with + total_losses_with

            if total_games_with > 0:
                win_rate = total_wins_with / total_games_with
            else:
                win_rate = 0.0

            # Build a contingency table for chi-squared
            game_results = np.array([
                [
                    sum(p['wins'] for p in perfs_with),
                    sum(p['draws'] for p in perfs_with),
                    sum(p['losses'] for p in perfs_with)
                ],
                [
                    sum(p['wins'] for p in perfs_without),
                    sum(p['draws'] for p in perfs_without),
                    sum(p['losses'] for p in perfs_without)
                ]
            ])

            try:
                # Only do chi2 if none of the row/col sums are zero
                if np.all(game_results.sum(axis=0) > 0) and np.all(game_results.sum(axis=1) > 0):
                    chi2, p_value = stats.chi2_contingency(game_results)[:2]
                else:
                    chi2, p_value = 0.0, 1.0
            except Exception:
                chi2, p_value = 0.0, 1.0

            card_details = card_details_lookup.get(unique_card_id)
            if card_details and card_details.scryfall_card:
                # Build the card stat object
                card_stat = {
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
                        'deck_win_rate': meta_stats['baseline_performance']['win_rate'],
                        'card_win_rate': float(win_rate),
                        'chi_squared': float(chi2),
                        'p_value': float(p_value)
                    }
                }

                # Check if this card is part of the submitted deck_structure
                if unique_card_id in deck_structure:
                    # It's in the user's deck, so we place it under main -> <type_code>
                    type_code = deck_structure[unique_card_id].get("type", "0")

                    # Make sure we have a key for that type_code. If not, either create it or skip it.
                    if type_code not in main_cards:
                        main_cards[type_code] = []

                    main_cards[type_code].append(card_stat)
                else:
                    # Not in the user's deck structure, so it belongs in 'other'
                    other_cards.append(card_stat)

         # -----------------------------------------
        # Sort each type's array by CMC, then by name
        # -----------------------------------------
        for type_code, card_list in main_cards.items():
            card_list.sort(
                key=lambda c: (
                    (c['cmc'] if c['cmc'] is not None else 0), c['name'].lower())
            )

        # If you also want to sort 'other' by CMC then name (not by type, but globally):
        other_cards.sort(
            key=lambda c: (
                (c['cmc'] if c['cmc'] is not None else 0), c['name'].lower())
        )

        # Return the reorganized and sorted card statistics
        return {
            "main": main_cards,
            "other": other_cards
        }

    def _get_earliest_printing(self, unique_card_id):
        """Get the earliest printing of a card with the most relevant Scryfall details 
        and return the MoxfieldCard object (including its related ScryfallCard)."""
        earliest_card = MoxfieldCard.objects.filter(
            unique_card_id=unique_card_id
        ).order_by(
            'scryfall_card__released_at',
            'scryfall_card__collector_number'
        ).select_related('scryfall_card').first()

        if not earliest_card or not earliest_card.scryfall_card:
            return None

        # Return the MoxfieldCard, which includes .scryfall_card
        return earliest_card

    def _get_most_popular_printing(self, unique_card_id):
        """
        Return the MoxfieldCard object (including its related ScryfallCard) 
        that is used by the greatest number of decks, using the materialized view.
        """
        # Get the most common printing from our materialized view
        popular_printing = CardPrintings.objects.filter(
            unique_card_id=unique_card_id
        ).first()

        if not popular_printing:
            return None

        # Get the MoxfieldCard with the related ScryfallCard
        most_popular_card = (
            MoxfieldCard.objects.filter(
                unique_card_id=unique_card_id,
                scryfall_card_id=popular_printing.most_common_printing
            )
            .select_related('scryfall_card')
            .first()
        )

        if not most_popular_card or not most_popular_card.scryfall_card:
            return None

        return most_popular_card

    def _get_latest_printing(self, unique_card_id):
        """Get the most recent printing of a card with the most relevant Scryfall details 
        and return the MoxfieldCard object (including its related ScryfallCard)."""
        latest_card = MoxfieldCard.objects.filter(
            unique_card_id=unique_card_id
        ).order_by(
            '-scryfall_card__released_at',
            '-scryfall_card__collector_number'
        ).select_related('scryfall_card').first()

        if not latest_card or not latest_card.scryfall_card:
            return None

        return latest_card

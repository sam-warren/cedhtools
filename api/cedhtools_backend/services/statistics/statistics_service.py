from typing import List, Dict, Optional, Tuple
import numpy as np
from scipy import stats
from .statistics_repository import StatisticsRepository
from .dto import MetaStatisticsDTO, CardStatisticsDTO, CardPerformanceDTO
from ...models import MoxfieldDeck, CommanderDeckRelationships, TopdeckPlayerStanding, MoxfieldCard, CardPrintings


class StatisticsService:
    def __init__(self):
        self.repository = StatisticsRepository()

    def _get_card_details(self, unique_card_id: str, scryfall_id: str) -> Optional[MoxfieldCard]:
        """
        Get card details using unique_card_id and scryfall_id.

        Args:
            unique_card_id: Unique identifier for the card
            scryfall_id: Scryfall ID for specific printing

        Returns:
            MoxfieldCard object with related ScryfallCard or None if not found
        """
        try:
            return (MoxfieldCard.objects
                    .filter(
                        unique_card_id=unique_card_id,
                        scryfall_card_id=scryfall_id
                    )
                    .select_related('scryfall_card')
                    .first())
        except Exception as e:
            print(
                f"Error fetching card details for {unique_card_id}: {str(e)}")
            return None

    def _calculate_chi_squared_from_totals(
        self,
        total_wins: int,
        total_draws: int,
        total_losses: int,
        baseline_performance: Dict[str, float]
    ) -> Tuple[float, float]:
        """Calculate chi-squared test statistic and p-value from totals."""
        try:
            total_games = total_wins + total_draws + total_losses
            if total_games == 0:
                return 0.0, 1.0

            # Expected values based on baseline performance
            expected_wins = total_games * baseline_performance["win_rate"]
            expected_draws = total_games * \
                baseline_performance["draw_rate"]
            expected_losses = total_games * \
                baseline_performance["loss_rate"]

            # Observed values
            observed = np.array([total_wins, total_draws, total_losses])
            expected = np.array(
                [expected_wins, expected_draws, expected_losses])

            # Only do chi2 if expected values are all non-zero
            if np.all(expected > 0):
                chi2, p_value = stats.chisquare(observed, expected)
                return float(chi2), float(p_value)

            return 0.0, 1.0
        except Exception as e:
            print(f"Error calculating chi-squared: {str(e)}")
            return 0.0, 1.0

    def calculate_statistics(
        self,
        commander_ids: List[str],
        deck_structure: Dict,
        time_period: str,
        min_size: int
    ) -> Dict:
        """
        Calculate comprehensive statistics for commanders.

        Returns a dictionary with statistics or an empty structure if no data is found.
        """
        # Get pre-calculated meta statistics
        meta_stats = self.repository.get_meta_statistics(
            commander_ids, time_period, min_size)

        # If no meta stats found, create an empty meta statistics DTO
        if not meta_stats:
            meta_stats_dto = MetaStatisticsDTO(
                sample_size={"total_decks": 0},
                baseline_performance={
                    "win_rate": 0.0,
                    "draw_rate": 0.0,
                    "loss_rate": 0.0
                }
            )
        else:
            meta_stats_dto = MetaStatisticsDTO.from_repository_data(meta_stats)

        # Get pre-calculated card statistics
        card_stats = self.repository.get_card_statistics(
            commander_ids, time_period, min_size)

        # If no card stats, return empty structures
        if not card_stats:
            return {
                "meta_statistics": meta_stats_dto,
                "card_statistics": {
                    "main": {str(i): [] for i in range(1, 9)},
                    "other": []
                }
            }

        # Process card statistics into categorized structure
        main_cards = {str(i): [] for i in range(1, 9)}
        other_cards = []

        for stat in card_stats:
            card_dto = self._create_card_dto(stat, meta_stats_dto)
            if not card_dto:
                continue

            # Sort into appropriate category
            if card_dto.unique_card_id in deck_structure:
                type_code = deck_structure[card_dto.unique_card_id].get(
                    "type", "0")
                if type_code in main_cards:
                    main_cards[type_code].append(card_dto)
                else:
                    # Type code is recognized in deck_structure, but not recognized by main_cards
                    other_cards.append(card_dto)
            else:
                other_cards.append(card_dto)

        # Sort each category
        for type_code, card_list in main_cards.items():
            card_list.sort(key=lambda c: (
                c.cmc if c.cmc is not None else 0,
                c.name.lower()
            ))

        other_cards.sort(key=lambda c: (
            c.cmc if c.cmc is not None else 0,
            c.name.lower()
        ))

        return {
            "meta_statistics": meta_stats_dto,
            "card_statistics": {
                "main": main_cards,
                "other": other_cards
            }
        }

    def _create_card_dto(self, stat: Dict, meta_stats: MetaStatisticsDTO) -> Optional[CardStatisticsDTO]:
        """Create CardStatisticsDTO from pre-calculated statistics."""
        # Get card details using most common printing
        card_details = self._get_card_details(
            stat['unique_card_id'],
            stat['most_common_printing']
        )
        if not card_details:
            return None

        # Calculate chi-squared test from pre-calculated totals
        chi2, p_value = self._calculate_chi_squared_from_totals(
            stat['total_wins'],
            stat['total_draws'],
            stat['total_losses'],
            meta_stats.baseline_performance
        )

        return CardStatisticsDTO(
            unique_card_id=stat['unique_card_id'],
            scryfall_id=str(card_details.scryfall_card.id),
            name=card_details.scryfall_card.name,
            type_line=card_details.scryfall_card.type_line,
            cmc=card_details.scryfall_card.cmc,
            image_uris=card_details.scryfall_card.image_uris,
            legality=card_details.scryfall_card.legality,
            mana_cost=card_details.scryfall_card.mana_cost,
            scryfall_uri=card_details.scryfall_card.scryfall_uri,
            decks_with_card=stat['deck_count'],
            performance=CardPerformanceDTO(
                deck_win_rate=meta_stats.baseline_performance["win_rate"],
                card_win_rate=stat['avg_win_rate'],
                win_rate_diff=(stat['avg_win_rate'] -
                               meta_stats.baseline_performance["win_rate"]) * 100,
                chi_squared=chi2,
                p_value=p_value
            )
        )

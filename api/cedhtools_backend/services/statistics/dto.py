from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MetaStatisticsDTO:
    sample_size: Dict[str, int]
    baseline_performance: Dict[str, float]

    @classmethod
    def from_repository_data(cls, repo_data: Dict) -> 'MetaStatisticsDTO':
        """
        Create DTO from repository data.

        Args:
            repo_data (Dict): Dictionary containing meta statistics from repository

        Returns:
            MetaStatisticsDTO: Transformed data transfer object
        """
        return cls(
            sample_size={
                "total_decks": repo_data.get('total_decks', 0),
                "num_unique_cards": repo_data.get('num_unique_cards', 0)
            },
            baseline_performance={
                "win_rate": repo_data.get('avg_win_rate', 0.0),
                "draw_rate": repo_data.get('avg_draw_rate', 0.0),
                "loss_rate": repo_data.get('avg_loss_rate', 0.0)
            }
        )


@dataclass
class CardPerformanceDTO:
    deck_win_rate: float
    card_win_rate: float
    win_rate_diff: float
    chi_squared: float
    p_value: float


@dataclass
class CardStatisticsDTO:
    unique_card_id: str
    scryfall_id: str
    name: str
    type_line: str
    cmc: float
    image_uris: Dict
    legality: str
    mana_cost: str
    scryfall_uri: str
    decks_with_card: int
    performance: CardPerformanceDTO

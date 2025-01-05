from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MetaStatisticsDTO:
    sample_size: Dict[str, int]
    baseline_performance: Dict[str, float]

    @classmethod
    def from_repository_data(cls, repo_data: Dict) -> 'MetaStatisticsDTO':
        """Create DTO from repository data."""
        return cls(
            sample_size={
                "total_decks": repo_data['total_decks']
            },
            baseline_performance={
                "win_rate": repo_data['avg_win_rate'],
                "draw_rate": repo_data['avg_draw_rate'],
                "loss_rate": repo_data['avg_loss_rate']
            }
        )


@dataclass
class CardPerformanceDTO:
    deck_win_rate: float
    card_win_rate: float
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

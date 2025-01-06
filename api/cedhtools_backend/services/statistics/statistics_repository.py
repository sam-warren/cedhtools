from typing import List, Dict, Optional
from django.db.models import Q
from ...models import (
    CommanderMetaStatistics, CardStatisticsByCommander
)

# TODO: Build materialized views for time and tournament period filters

class StatisticsRepository:
    @staticmethod
    def get_meta_statistics(commander_ids: List[str], time_period: str, min_size: str) -> Optional[Dict]:
        """Get pre-calculated meta-level statistics for commanders."""
        stats = CommanderMetaStatistics.objects.filter(
            commander_list=sorted(commander_ids)
        ).first()

        if not stats:
            return None

        return {
            'total_decks': stats.total_decks,
            'avg_win_rate': stats.avg_win_rate,
            'avg_draw_rate': stats.avg_draw_rate,
            'avg_loss_rate': stats.avg_loss_rate,
            'win_rate_stddev': stats.win_rate_stddev
        }

    @staticmethod
    def get_card_statistics(commander_ids: List[str], time_period: str, min_size: str) -> List[Dict]:
        """Get pre-calculated card statistics for commanders."""
        return CardStatisticsByCommander.objects.filter(
            commander_list=sorted(commander_ids)
        ).values(
            'unique_card_id',
            'deck_count',
            'avg_win_rate',
            'win_rate_stddev',
            'avg_draw_rate',
            'avg_loss_rate',
            'total_wins',
            'total_draws',
            'total_losses',
            'most_common_printing'
        )

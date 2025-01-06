from typing import List, Dict, Optional
from django.db import models
from django.db.models import Q
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Cast
from ...models import (
    CommanderMetaStatisticsFiltered, CardStatisticsByCommanderFiltered
)


class StatisticsRepository:
    @staticmethod
    def get_meta_statistics(
        commander_ids: List[str],
        time_period: str = 'all',
        min_size: int = 0
    ) -> Optional[Dict]:
        """Get pre-calculated meta-level statistics for commanders."""
        sorted_ids = sorted(commander_ids)

        stats = CommanderMetaStatisticsFiltered.objects.extra(
            where=['"commander_list" = %s::varchar[]'],
            params=[sorted_ids]
        ).filter(
            period_name=time_period,
            min_tournament_size=min_size
        ).first()

        if not stats:
            return None

        return {
            'total_decks': stats.total_decks,
            'avg_win_rate': stats.avg_win_rate,
            'avg_draw_rate': stats.avg_draw_rate,
            'avg_loss_rate': stats.avg_loss_rate,
            'win_rate_stddev': stats.win_rate_stddev,
            'period': time_period,
            'min_tournament_size': min_size
        }

    @staticmethod
    def get_card_statistics(
        commander_ids: List[str],
        time_period: str = 'all',
        min_size: int = 0
    ) -> List[Dict]:
        """Get pre-calculated card statistics for commanders."""
        sorted_ids = sorted(commander_ids)

        return CardStatisticsByCommanderFiltered.objects.extra(
            where=['"commander_list" = %s::varchar[]'],
            params=[sorted_ids]
        ).filter(
            period_name=time_period,
            min_players=min_size
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

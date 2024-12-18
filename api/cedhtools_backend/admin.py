from django.contrib import admin
from .models import CommanderCardStats


@admin.register(CommanderCardStats)
class CommanderCardStatsAdmin(admin.ModelAdmin):
    list_display = ('commander_names', 'card_name', 'total_decks',
                    'avg_win_rate', 'tournament_size', 'start_date')
    list_filter = ('tournament_size', 'start_date', 'top_cut')
    search_fields = ('commander_names', 'card_name')

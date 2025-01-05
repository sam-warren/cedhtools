# cedhtools_backend/api/urls.py
from django.urls import path
from ..views import MoxfieldDeckView, TopdeckTournamentView, CommanderStatisticsView, CommanderDeckAnalysisView, MetricsView

urlpatterns = [
    path('moxfield/deck/<str:deck_id>/',
         MoxfieldDeckView.as_view(), name='moxfield_deck'),
    path('topdeck/tournament/<str:tournament_id>/',
         TopdeckTournamentView.as_view(), name='topdeck_tournament'),
    path(
        'decks/<str:deck_id>/analysis/',
        CommanderDeckAnalysisView.as_view(),
        name='deck-analysis'
    ),
    path(
        'commanders/statistics/',
        CommanderStatisticsView.as_view(),
        name='commander-statistics'
    ),
    path('metrics/', MetricsView.as_view(), name='metrics'),
]

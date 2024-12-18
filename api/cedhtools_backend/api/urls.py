# cedhtools_backend/api/urls.py
from django.urls import path
from ..views import MoxfieldDeckView, TopdeckTournamentView, CommanderStatisticsView

urlpatterns = [
    path('moxfield/deck/<str:deck_id>/',
         MoxfieldDeckView.as_view(), name='moxfield_deck'),
    path('topdeck/tournament/<str:tournament_id>/',
         TopdeckTournamentView.as_view(), name='topdeck_tournament'),
    path('cedhtools/commander/statistics/', CommanderStatisticsView.as_view(),
         name='commander-statistics'),
]

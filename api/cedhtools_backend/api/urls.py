# cedhtools_backend/api/urls.py
from django.urls import path
from ..views import MoxfieldDeckView, TopdeckTournamentView, TestView, CommanderWinRateView

urlpatterns = [
    path('moxfield/deck/<str:deck_id>/',
         MoxfieldDeckView.as_view(), name='moxfield_deck'),
    path('topdeck/tournament/<str:tournament_id>/',
         TopdeckTournamentView.as_view(), name='topdeck_tournament'),
    path('cedhtools/testview/<str:player_id>/',
         TestView.as_view(), name='test_view'),
    path('cedhtools/commander-win-rates/',
         CommanderWinRateView.as_view(), name='commander_win_rates'),
]

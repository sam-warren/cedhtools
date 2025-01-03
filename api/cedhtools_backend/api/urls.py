# cedhtools_backend/api/urls.py
from django.urls import path
from ..views import MoxfieldDeckView, TopdeckTournamentView, CommanderStatisticsView, DatabaseStatisticsView, MetricsView

urlpatterns = [
    path('moxfield/deck/<str:deck_id>/',
         MoxfieldDeckView.as_view(), name='moxfield_deck'),
    path('topdeck/tournament/<str:tournament_id>/',
         TopdeckTournamentView.as_view(), name='topdeck_tournament'),
    path('commander-statistics/<str:deck_id>/',
         CommanderStatisticsView.as_view(),
         name='commander_statistics'),
    path('database-statistics/', DatabaseStatisticsView.as_view(),
         name='database-statistics'),
    path('metrics/', MetricsView.as_view(), name='metrics'),


]

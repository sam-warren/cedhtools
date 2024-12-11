# cedhtools_backend/api/urls.py
from django.urls import path
from .views import MoxfieldDeckView

urlpatterns = [
    path('moxfield/deck/<str:deck_id>/', MoxfieldDeckView.as_view(), name='moxfield_deck'),
]
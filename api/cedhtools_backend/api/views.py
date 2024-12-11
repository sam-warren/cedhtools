from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from cedhtools_backend.services import fetch_moxfield_deck

class MoxfieldDeckView(View):
    def get(self, request, deck_id):
        try:
            data = fetch_moxfield_deck(deck_id)
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
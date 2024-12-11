# views/moxfield_deck.py
from django.http import JsonResponse
from django.views import View
from ..services.moxfield import MoxfieldClient
import logging

logger = logging.getLogger(__name__)

class MoxfieldDeckView(View):
    def get(self, request, deck_id):
        client = MoxfieldClient()
        response = client.fetch_deck(deck_id)

        if response["error"]:
            logger.error(f"Error fetching deck {deck_id}: {response['error_message']}")
            return JsonResponse(
                {"error": response["error_message"]},
                status=response["status"]
            )

        # If success
        return JsonResponse(response["data"], status=200)

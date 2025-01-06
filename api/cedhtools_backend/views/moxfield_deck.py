from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..services.external.moxfield_client import MoxfieldClient
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class MoxfieldDeckView(View):
    def get(self, request, deck_id):
        client = MoxfieldClient()
        response = client.fetch_deck(deck_id)

        if response.get("error"):
            logger.error(
                f"Error fetching deck {deck_id}: {response['error_message']}")
            return self._create_response(
                {"error": response["error_message"]},
                status=response["status"]
            )

        return self._create_response(response["data"], status=200)

    def options(self, request, *args, **kwargs):
        """Handle preflight CORS requests"""
        return self._create_response({})

    def _create_response(self, data, status=200):
        """Create a JsonResponse with CORS headers"""
        response = JsonResponse(data, status=status)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

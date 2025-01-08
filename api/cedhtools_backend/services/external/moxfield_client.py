import os
import requests
from typing import Optional
from ...utilities import create_error_response, create_success_response
from django.conf import settings


class MoxfieldClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": settings.MOXFIELD_USER_AGENT})

    def fetch_deck(self, deck_id: str) -> dict:
        try:
            url = f"{settings.MOXFIELD_API_BASE_URL}/decks/all/{deck_id}"
            response = self.session.get(url)
            response.raise_for_status()

            data = response.json()

            validation_error = self._validate_deck(data)
            if validation_error:
                return validation_error

            return create_success_response(data)

        except requests.exceptions.HTTPError as http_err:
            return self._handle_http_error(http_err)
        except Exception as e:
            return create_error_response(
                f"An unexpected error occurred: {str(e)}",
                500
            )

    def _validate_deck(self, data: dict) -> Optional[dict]:
        if data.get("format") != "commander":
            return create_error_response("Moxfield deck format must be Commander", 400)

        mainboard_count = data.get("boards", {}).get(
            "mainboard", {}).get("count", {})
        commanders_count = data.get("boards", {}).get(
            "commanders", {}).get("count", {})
        companions_count = data.get("boards", {}).get(
            "companions", {}).get("count", {})

        if mainboard_count + commanders_count + companions_count != 100:
            return create_error_response("Deck must contain exactly 100 cards.", 400)

        return None

    def _handle_http_error(self, http_err: requests.exceptions.HTTPError) -> dict:
        status_code = http_err.response.status_code

        if status_code == 404:
            return create_error_response(
                "No deck found for the given Moxfield URL. Please ensure the deck is public on Moxfield.",
                404
            )

        if status_code == 500:
            return create_error_response(
                "Moxfield is currently experiencing issues. Please try again later.",
                500
            )

        return create_error_response(
            f"Error fetching Moxfield deck: {http_err}",
            status_code
        )

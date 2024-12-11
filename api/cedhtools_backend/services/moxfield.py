import os
import requests
from typing import Optional
from ..utilities.utilities import create_error_response, create_success_response

class MoxfieldClient:
    BASE_URL = os.getenv("MOXFIELD_API_BASE_URL")
    USER_AGENT = os.getenv("MOXFIELD_USER_AGENT")

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.USER_AGENT})
    
    def fetch_deck(self, deck_id: str) -> dict:
        try:
            url = f"{self.BASE_URL}/decks/all/{deck_id}"
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
            return create_error_response("Deck must be in Commander format.", 400)

        mainboard_count = len(data.get("boards", {}).get("mainboard", {}).get("cards", {}))
        commanders_count = len(data.get("boards", {}).get("commanders", {}).get("cards", {}))

        if mainboard_count + commanders_count != 100:
            return create_error_response("Deck must contain exactly 100 cards.", 400)
        
        return None

    def _handle_http_error(self, http_err: requests.exceptions.HTTPError) -> dict:
        status_code = http_err.response.status_code

        if status_code == 404:
            return create_error_response(
                "No deck found at this URL. Please ensure the deck is public on Moxfield.",
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
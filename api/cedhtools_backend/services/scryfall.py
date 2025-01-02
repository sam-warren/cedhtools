import os
import requests
import time
from typing import Optional, List, Dict
from ..utilities import create_error_response, create_success_response
from django.conf import settings


class ScryfallClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": settings.SCRYFALL_USER_AGENT,
            "Content-Type": "application/json"
        })
        self.last_request_time = 0
        self.min_request_interval = 0.05  # 100ms between requests

    def _make_request(self, url: str, payload: dict) -> requests.Response:
        """
        Make a rate-limited request to Scryfall's API.

        Args:
            url: The API endpoint URL
            payload: The request payload

        Returns:
            Response from the API
        """
        # Ensure minimum time between requests
        time_since_last = time.time() - self.last_request_time
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)

        response = self.session.post(url, json=payload)
        self.last_request_time = time.time()

        return response

    def fetch_cards(self, card_ids: List[str]) -> dict:
        """
        Fetch multiple cards from Scryfall's collection endpoint with batching.

        Args:
            card_ids: List of Scryfall card IDs to fetch

        Returns:
            Dictionary containing either the card data or error information
        """
        try:
            # Initialize storage for all card data
            all_cards = []
            not_found = []

            # Process in batches of 75 cards
            for i in range(0, len(card_ids), 75):
                batch = card_ids[i:i + 75]
                url = f"{settings.SCRYFALL_API_BASE_URL}/cards/collection"

                payload = {
                    "identifiers": [{"id": card_id} for card_id in batch]
                }

                response = self._make_request(url, payload)
                response.raise_for_status()

                data = response.json()

                # Accumulate results
                all_cards.eextend(data.get("data", []))
                not_found.extend(data.get("not_found", []))

            if not_found:
                return create_error_response(
                    f"Could not find {len(not_found)} requested cards",
                    404
                )

            processed_cards = self._process_card_data(all_cards)
            return create_success_response(processed_cards)

        except requests.exceptions.HTTPError as http_err:
            return self._handle_http_error(http_err)
        except Exception as e:
            return create_error_response(
                f"An unexpected error occurred: {str(e)}",
                500
            )

    def _process_card_data(self, cards: List[Dict]) -> List[Dict]:
        """
        Process the raw card data to extract only the fields we need.

        Args:
            cards: List of card data from Scryfall

        Returns:
            List of processed card dictionaries with selected fields
        """
        processed_cards = []

        for card in cards:
            processed_card = {
                "name": card.get("name"),
                "mana_cost": card.get("mana_cost"),
                "image_uris": card.get("image_uris", {}).get("normal"),
                "legalities": {
                    "commander": card.get("legalities", {}).get("commander")
                },
            }
            processed_cards.append(processed_card)

        return processed_cards

    def _handle_http_error(self, http_err: requests.exceptions.HTTPError) -> dict:
        """
        Handle HTTP errors from the Scryfall API.

        Args:
            http_err: The HTTP error that occurred

        Returns:
            Error response dictionary
        """
        status_code = http_err.response.status_code

        if status_code == 404:
            return create_error_response(
                "No cards found with the provided identifiers.",
                404
            )

        if status_code == 429:
            return create_error_response(
                "Too many requests to Scryfall API. Please try again later.",
                429
            )

        if status_code == 500:
            return create_error_response(
                "Scryfall is currently experiencing issues. Please try again later.",
                500
            )

        return create_error_response(
            f"Error fetching Scryfall cards: {http_err}",
            status_code
        )

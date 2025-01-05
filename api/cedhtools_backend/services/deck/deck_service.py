from typing import Dict, Optional
from .deck_repository import DeckRepository
from ..external.moxfield_client import MoxfieldClient


class DeckService:
    def __init__(self):
        self.repository = DeckRepository()
        self.moxfield_client = MoxfieldClient()

    def get_deck_data(self, deck_id: str) -> Optional[Dict]:
        """Get deck data from Moxfield."""
        deck_response = self.moxfield_client.fetch_deck(deck_id)

        if deck_response["error"]:
            return None

        return deck_response["data"]

    def get_deck_structure(self, deck_data: Dict) -> Dict:
        """Build lookup table for card categorization."""
        deck_structure = {}
        valid_boards = {"mainboard", "companions"}

        for board_name, board_data in deck_data.get("boards", {}).items():
            if board_name not in valid_boards:
                continue

            for card_data in board_data.get("cards", {}).values():
                card_info = card_data.get("card", {})
                unique_id = card_info.get("uniqueCardId")
                if unique_id:
                    deck_structure[unique_id] = {
                        "board": board_name,
                        "type": card_info["type"]
                    }

        return deck_structure

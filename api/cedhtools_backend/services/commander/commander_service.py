from typing import List, Dict, Tuple
from .commander_repository import CommanderRepository
from .dto import CommanderDTO, DeckStructureDTO
from ..deck.deck_service import DeckService
from ..statistics.statistics_service import StatisticsService


class CommanderService:
    def __init__(self):
        self.repository = CommanderRepository()
        self.deck_service = DeckService()
        self.statistics_service = StatisticsService()

    def get_commander_statistics(self, deck_id: str) -> Dict:
        """Get comprehensive statistics for a commander deck."""
        # Get deck data from Moxfield
        deck_data = self.deck_service.get_deck_data(deck_id)
        if not deck_data:
            raise ValueError("No deck data found")

        # Extract commander information
        commander_info = self._extract_commanders(deck_data)
        if not commander_info["commander_ids"]:
            raise ValueError("No commanders found in deck")

        # Get deck structure
        deck_structure = self.deck_service.get_deck_structure(deck_data)

        # Calculate statistics
        statistics = self.statistics_service.calculate_statistics(
            commander_info["commander_ids"],
            deck_structure
        )

        return {
            "meta_statistics": statistics["meta_statistics"],
            "card_statistics": statistics["card_statistics"],
            "commanders": commander_info["commander_details"]
        }

    def _extract_commanders(self, deck_data: Dict) -> Dict:
        """Extract commander information from deck data."""
        commander_ids = []
        commander_board = deck_data.get("boards", {}).get("commanders", {})

        for card_data in commander_board.get("cards", {}).values():
            card_info = card_data.get("card", {})
            if card_info.get("uniqueCardId"):
                commander_ids.append(card_info["uniqueCardId"])

        commander_details = self.repository.get_commander_details(
            commander_ids)

        sorted_details = sorted(
            commander_details,
            key=lambda x: x.get('name', '') if isinstance(x, dict) else ''
        )

        return {
            "commander_ids": sorted(commander_ids),
            "commander_details": sorted_details
        }

from dataclasses import dataclass
from typing import Dict, Optional, List


@dataclass
class DeckCardDTO:
    unique_card_id: str
    board: str
    type_code: str
    quantity: int


@dataclass
class DeckDTO:
    id: str
    public_id: str
    cards: List[DeckCardDTO]


@dataclass
class DeckStructureDTO:
    board: str
    type_code: str

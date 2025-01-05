from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime


@dataclass
class CommanderDTO:
    unique_card_id: str
    scryfall_id: str
    name: str
    type_line: str
    cmc: float
    image_uris: Dict
    legality: str
    mana_cost: str
    scryfall_uri: str


@dataclass
class DeckStructureDTO:
    board: str
    type_code: str
